import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set OpenMP environment variables if specified in .env
if os.getenv('OMP_NUM_THREADS'):
    os.environ['OMP_NUM_THREADS'] = os.getenv('OMP_NUM_THREADS')
if os.getenv('KMP_DUPLICATE_LIB_OK'):
    os.environ['KMP_DUPLICATE_LIB_OK'] = os.getenv('KMP_DUPLICATE_LIB_OK')

# Configuration
FLASK_PORT = int(os.getenv('FLASK_PORT', 9000))
FLASK_HOST = os.getenv('FLASK_HOST', '127.0.0.1')
API_RECEIVER_URL = f"http://{FLASK_HOST}:{FLASK_PORT}/receive"
