#!/usr/bin/env python3
"""
Development server startup script for Musical Practice Companion Backend.
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    """Start the development server with configuration from environment."""
    
    # Get configuration from environment
    host = os.getenv('API_HOST', '0.0.0.0')
    port = int(os.getenv('API_PORT', '8000'))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    log_level = os.getenv('LOG_LEVEL', 'info').lower()
    
    print(f"Starting Musical Practice Companion Backend...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"Log Level: {log_level}")
    print(f"Access at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    print(f"API Docs: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/docs")
    print("-" * 50)
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level=log_level,
        access_log=True
    )

if __name__ == "__main__":
    main()
