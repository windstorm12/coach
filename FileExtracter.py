import os
import sys
from pathlib import Path
from typing import Set, List
import argparse

def get_file_content(file_path: Path, encoding_list: List[str] = ['utf-8', 'latin-1', 'cp1252']) -> str:
    """
    Try to read file content with multiple encodings.
    Returns content or error message.
    """
    for encoding in encoding_list:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
        except Exception as e:
            return f"[Error reading file: {str(e)}]"
    
    # If text reading fails, note it's likely binary
    return "[Binary file or unreadable encoding - skipped]"

def should_ignore_path(path: Path, ignore_folders: Set[str], ignore_patterns: Set[str], ignore_files: Set[str]) -> bool:
    """
    Check if path should be ignored based on folder names, patterns, or specific filenames.
    """
    path_parts = path.parts
    
    # Check if specific file should be ignored
    if path.name in ignore_files:
        return True
    
    # Check exact folder names
    for part in path_parts:
        if part in ignore_folders:
            return True
    
    # Check patterns (like .git, __pycache__, etc.)
    for pattern in ignore_patterns:
        if pattern.startswith('*') and pattern.endswith('*'):
            # Contains pattern
            check = pattern[1:-1]
            if any(check in part for part in path_parts):
                return True
        elif pattern.startswith('*'):
            # Ends with pattern
            check = pattern[1:]
            if any(part.endswith(check) for part in path_parts):
                return True
        elif pattern.endswith('*'):
            # Starts with pattern
            check = pattern[:-1]
            if any(part.startswith(check) for part in path_parts):
                return True
        else:
            # Exact match
            if pattern in path_parts:
                return True
    
    return False

def aggregate_files(
    root_folder: str,
    output_file: str,
    ignore_folders: Set[str] = None,
    ignore_extensions: Set[str] = None,
    ignore_files: Set[str] = None,
    max_file_size_mb: float = 10
) -> None:
    """
    Main function to aggregate all files into a single text file.
    """
    
    if ignore_folders is None:
        ignore_folders = set()
    
    if ignore_extensions is None:
        ignore_extensions = set()
    
    if ignore_files is None:
        ignore_files = set()
    
    root_path = Path(root_folder).resolve()
    
    if not root_path.exists():
        print(f"Error: Folder '{root_folder}' does not exist!")
        return
    
    if not root_path.is_dir():
        print(f"Error: '{root_folder}' is not a directory!")
        return
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    print(f"Starting file aggregation from: {root_path}")
    print(f"Output will be saved to: {output_file}")
    print(f"Ignoring folders: {ignore_folders if ignore_folders else 'None'}")
    print(f"Ignoring extensions: {ignore_extensions if ignore_extensions else 'None'}")
    print(f"Ignoring files: {ignore_files if ignore_files else 'None'}")
    print("-" * 80)
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(f"FILE AGGREGATION REPORT\n")
        outfile.write(f"Source Directory: {root_path}\n")
        outfile.write(f"=" * 80 + "\n\n")
        
        for file_path in root_path.rglob('*'):
            # Skip directories
            if file_path.is_dir():
                continue
            
            # Check if path should be ignored
            if should_ignore_path(file_path, ignore_folders, set(), ignore_files):
                skipped_count += 1
                continue
            
            # Check file extension
            if ignore_extensions and file_path.suffix in ignore_extensions:
                skipped_count += 1
                continue
            
            # Check file size
            try:
                file_size_mb = file_path.stat().st_size / (1024 * 1024)
                if file_size_mb > max_file_size_mb:
                    print(f"Skipping large file ({file_size_mb:.2f} MB): {file_path}")
                    skipped_count += 1
                    continue
            except:
                pass
            
            # Process the file
            relative_path = file_path.relative_to(root_path)
            
            print(f"Processing: {relative_path}")
            
            outfile.write(f"{'=' * 80}\n")
            outfile.write(f"FILE: {relative_path}\n")
            outfile.write(f"FULL PATH: {file_path}\n")
            outfile.write(f"{'=' * 80}\n")
            
            content = get_file_content(file_path)
            
            if "[Error" in content or "[Binary" in content:
                error_count += 1
                outfile.write(f"{content}\n")
            else:
                outfile.write(f"{content}\n")
                processed_count += 1
            
            outfile.write(f"\n{'=' * 80}\n\n")
    
    print("-" * 80)
    print(f"Aggregation complete!")
    print(f"Files processed successfully: {processed_count}")
    print(f"Files skipped (ignored paths/extensions/files): {skipped_count}")
    print(f"Files with errors or binary: {error_count}")
    print(f"Output saved to: {output_file}")

def main():
    """
    Interactive mode for the script.
    """
    print("FILE AGGREGATOR TOOL")
    print("=" * 80)
    
    # Get root folder
    root_folder = input("Enter the folder path to scan (or '.' for current directory): ").strip()
    if not root_folder:
        root_folder = "."
    
    # Get output file name
    output_file = input("Enter output file name (default: 'aggregated_files.txt'): ").strip()
    if not output_file:
        output_file = "aggregated_files.txt"
    
    # Get folders to ignore
    print("\nEnter folder names to ignore (one per line, empty line to finish):")
    print("Examples: node_modules, .git, __pycache__, dist, build")
    
    ignore_folders = set()
    while True:
        folder = input("> ").strip()
        if not folder:
            break
        ignore_folders.add(folder)
    
    # Get specific files to ignore
    print("\nEnter specific file names to ignore (one per line, empty line to finish):")
    print("Examples: package-lock.json, .DS_Store, favicon.ico")
    
    ignore_files = set()
    while True:
        filename = input("> ").strip()
        if not filename:
            break
        ignore_files.add(filename)
    
    # Get file extensions to ignore
    print("\nEnter file extensions to ignore (e.g., .pyc, .exe, .jpg) (one per line, empty line to finish):")
    
    ignore_extensions = set()
    while True:
        ext = input("> ").strip()
        if not ext:
            break
        if not ext.startswith('.'):
            ext = '.' + ext
        ignore_extensions.add(ext)
    
    # Get max file size
    max_size_input = input("\nMax file size in MB to include (default: 10): ").strip()
    try:
        max_file_size = float(max_size_input) if max_size_input else 10
    except ValueError:
        max_file_size = 10
    
    print("\n" + "=" * 80)
    
    # Run aggregation
    aggregate_files(
        root_folder=root_folder,
        output_file=output_file,
        ignore_folders=ignore_folders,
        ignore_extensions=ignore_extensions,
        ignore_files=ignore_files,
        max_file_size_mb=max_file_size
    )

if __name__ == "__main__":
    # You can also use it directly without interaction:
    # aggregate_files(
    #     root_folder="./my_project",
    #     output_file="output.txt",
    #     ignore_folders={'node_modules', '.git', '__pycache__', 'dist', 'build'},
    #     ignore_extensions={'.pyc', '.jpg', '.png', '.pdf'},
    #     ignore_files={'package-lock.json', '.DS_Store', 'favicon.ico'}
    # )
    
    main()