"""
Test script to verify the setup and dependencies
"""

import sys
import os

def test_imports():
    """Test if all required packages are installed"""
    print("Testing package imports...")
    errors = []
    
    packages = {
        'flask': 'Flask',
        'flask_cors': 'Flask-CORS',
        'pandas': 'Pandas',
        'requests': 'Requests',
        'sqlite3': 'SQLite3 (built-in)'
    }
    
    for package, name in packages.items():
        try:
            __import__(package)
            print(f"  ✅ {name}")
        except ImportError:
            print(f"  ❌ {name} - NOT INSTALLED")
            errors.append(name)
    
    return len(errors) == 0

def test_api_key():
    """Test if Cerebras API key is set"""
    print("\nChecking API key...")
    api_key = os.getenv('CEREBRAS_API_KEY')
    
    if api_key and api_key != 'your-api-key-here':
        print(f"  ✅ CEREBRAS_API_KEY is set")
        return True
    else:
        print(f"  ⚠️  CEREBRAS_API_KEY not set or using default value")
        print(f"     Set it with: export CEREBRAS_API_KEY='your-key'")
        return False

def test_file_structure():
    """Test if all required files exist"""
    print("\nChecking file structure...")
    
    required_files = [
        'backend/agents.py',
        'backend/app.py',
        'templates/index.html',
        'requirements.txt',
        'README.md',
        'start.sh'
    ]
    
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} - MISSING")
            all_exist = False
    
    return all_exist

def test_agents():
    """Test if agents can be imported"""
    print("\nTesting agent system...")
    
    try:
        sys.path.insert(0, 'backend')
        from agents import MultiAgentOrchestrator, SQLAgent, DataAnalysisAgent, DataIngestionAgent
        print(f"  ✅ All agents imported successfully")
        return True
    except Exception as e:
        print(f"  ❌ Failed to import agents: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Enterprise Database Multi-Agent Manager - Setup Test")
    print("=" * 60)
    print()
    
    results = []
    results.append(("Package Imports", test_imports()))
    results.append(("File Structure", test_file_structure()))
    results.append(("Agent System", test_agents()))
    results.append(("API Key", test_api_key()))
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:20} {status}")
    
    all_passed = all(result[1] for result in results if result[0] != "API Key")
    api_key_set = results[-1][1]
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All critical tests passed!")
        if not api_key_set:
            print("⚠️  Remember to set CEREBRAS_API_KEY before running the app")
        print("\nYou can start the application with: ./start.sh")
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("   Run: pip install -r requirements.txt")
    print("=" * 60)

if __name__ == '__main__':
    main()

