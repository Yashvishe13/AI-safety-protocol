/**
 * Global type declarations for SentinelAI
 * Provides TypeScript support for CSS imports and other global types
 */

// Allow CSS file imports
declare module "*.css" {
  const content: string;
  export default content;
}

// Allow SCSS file imports
declare module "*.scss" {
  const content: string;
  export default content;
}

// Allow CSS module imports
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Allow SCSS module imports
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}
