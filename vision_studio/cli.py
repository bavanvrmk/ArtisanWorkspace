import argparse
import os
import sys
import json

def cmd_process(args):
    from processing import check_quality, remove_background, generate_tags, correct_lighting
    
    image_path = args.image_path
    if not os.path.exists(image_path):
        print(f"Error: Image '{image_path}' not found.")
        sys.exit(1)
        
    print(f"Processing '{image_path}'...")
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()
        
    # 1. Quality Check
    print("Checking quality...")
    passed, feedback = check_quality(image_bytes)
    print(f"  Quality Passed: {passed}")
    if feedback:
        print(f"  Feedback: {feedback}")
        
    # 2. Lighting Correction
    print("Correcting lighting...")
    corrected_bytes = correct_lighting(image_bytes)
        
    # 3. Background Removal
    if args.remove_bg:
        print("Removing background...")
        processed_bytes = remove_background(corrected_bytes)
    else:
        processed_bytes = corrected_bytes
        
    out_path = args.output or f"processed_{os.path.basename(image_path)}"
    with open(out_path, "wb") as f:
        f.write(processed_bytes)
    print(f"  Saved processed image to '{out_path}'")
        
    # 4. Tagging
    if args.tag:
        print("Generating tags...")
        tags = generate_tags(image_bytes)
        print("  Tags:")
        print(json.dumps(tags, indent=4))

def cmd_serve(args):
    import uvicorn
    from app import app
    print(f"Starting server on port {args.port}...")
    uvicorn.run(app, host="0.0.0.0", port=args.port)

def main():
    parser = argparse.ArgumentParser(description="Vision & Image Studio CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Process command
    process_parser = subparsers.add_parser("process", help="Process an image")
    process_parser.add_argument("image_path", help="Path to the image to process")
    process_parser.add_argument("--no-remove-bg", dest="remove_bg", action="store_false", help="Skip background removal")
    process_parser.add_argument("--no-tag", dest="tag", action="store_false", help="Skip generating tags")
    process_parser.add_argument("-o", "--output", help="Output path for processed image")
    
    # Serve command
    serve_parser = subparsers.add_parser("serve", help="Start the API server")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    
    args = parser.parse_args()
    
    if args.command == "process":
        cmd_process(args)
    elif args.command == "serve":
        cmd_serve(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
