#!/usr/bin/env python3

import sys
import os
import docx2txt
import re
import json
from datetime import datetime
from docx import Document
import xml.etree.ElementTree as ET
import zipfile

def extract_urls_from_docx(docx_path):
    """
    Extract all URLs/hyperlinks from a DOCX file using direct XML parsing
    """
    urls = []
    
    # List of URL prefixes to exclude (schema definitions and other non-content URLs)
    exclude_prefixes = [
        "http://schemas.",
        "https://schemas.",
        "http://www.w3.org/"
    ]
    
    try:
        # DOCX files are ZIP archives with XML content
        with zipfile.ZipFile(docx_path) as zf:
            # Check for document.xml which contains the main content
            if 'word/document.xml' in zf.namelist():
                with zf.open('word/document.xml') as content:
                    tree = ET.parse(content)
                    root = tree.getroot()
                    
                    # Define namespace for DOCX XML
                    ns = {
                        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
                    }
                    
                    # Find all hyperlink elements
                    for hyperlink in root.findall('.//w:hyperlink', ns):
                        # Get relationship ID
                        rel_id = hyperlink.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
                        
                        if rel_id:
                            # Need to check relationships file to get the actual URL
                            if 'word/_rels/document.xml.rels' in zf.namelist():
                                with zf.open('word/_rels/document.xml.rels') as rels_content:
                                    rels_tree = ET.parse(rels_content)
                                    rels_root = rels_tree.getroot()
                                    
                                    # Find the relationship with matching ID
                                    for rel in rels_root.findall('.//*[@Id="' + rel_id + '"]'):
                                        target = rel.get('Target')
                                        if target and (target.startswith('http') or target.startswith('www')):
                                            # Skip schema URLs and other non-content URLs
                                            if not any(target.startswith(prefix) for prefix in exclude_prefixes):
                                                urls.append(target)
            
            # Also check for any URLs in the document content directly
            if 'word/document.xml' in zf.namelist():
                with zf.open('word/document.xml') as content:
                    content_str = content.read().decode('utf-8')
                    # Find URLs using regex - only looking for content URLs, not schema references
                    url_pattern = re.compile(r'https?://(?!schemas\.)(?:[-\w.]|(?:%[\da-fA-F]{2}))+(?:/[-\w%!./?=&+#]*)?')
                    found_urls = url_pattern.findall(content_str)
                    for url in found_urls:
                        if url not in urls and not any(url.startswith(prefix) for prefix in exclude_prefixes):
                            urls.append(url)
    except Exception as e:
        print(f"Error extracting URLs: {e}")
    
    # Return only unique URLs
    return sorted(list(set(urls)))

def associate_urls_with_quotes(quotes, urls):
    """
    Associate URLs with specific quotes based on page numbers and other criteria
    """
    # Group URLs by page number
    url_by_page = {}
    
    # Extract page numbers from URLs (specific to Google Play Books format)
    for url in urls:
        page_match = re.search(r'GBS\.PA(\d+)', url)
        if page_match:
            page_num = page_match.group(1)
            if page_num not in url_by_page:
                url_by_page[page_num] = []
            url_by_page[page_num].append(url)
    
    # First pass: assign URLs to quotes based on page numbers
    for quote in quotes:
        if "page" in quote and quote["page"] in url_by_page:
            quote["urls"] = url_by_page[quote["page"]]
    
    # Find quotes that don't have URLs yet
    for quote in quotes:
        if "urls" not in quote:
            # Try to match based on content or context
            for page_num, page_urls in url_by_page.items():
                # Check if the quote might belong to this page based on context
                if "text" in quote and page_num in quote["text"]:
                    quote["urls"] = page_urls
                    break
    
    # Ensure each quote has at least one URL (use the book URL if nothing else available)
    book_urls = []
    for url in urls:
        if "GBS.PA" not in url or "w.0.0.0" not in url:  # Main book URL without specific location
            book_urls.append(url)
    
    # If no general book URL found, use the first URL
    if not book_urls and urls:
        book_urls = [urls[0]]
    
    # Assign at least one URL to each quote
    for quote in quotes:
        if "urls" not in quote or not quote["urls"]:
            if book_urls:
                quote["urls"] = book_urls
    
    return quotes

def convert_docx_to_json(docx_path):
    """
    Convert a DOCX file to JSON, extracting book info and quotes
    """
    if not os.path.exists(docx_path):
        print(f"Error: File {docx_path} does not exist.")
        return None
    
    # Extract text from docx
    text = docx2txt.process(docx_path)
    
    # Extract URLs using direct XML parsing
    urls = extract_urls_from_docx(docx_path)
    
    # Parse the text to extract metadata and quotes
    lines = text.strip().split('\n')
    book_data = {
        "title": "",
        "author": "",
        "publisher": "",
        "quotes": []
    }
    
    # URL regex pattern (matches most common URL formats) - as backup
    url_pattern = re.compile(r'https?://(?!schemas\.)(?:[-\w.]|(?:%[\da-fA-F]{2}))+(?:/[-\w%!./?=&+#]*)?')
    
    # Extract book info (title, author, publisher) from the beginning
    i = 0
    while i < min(10, len(lines)) and (not book_data["title"] or not book_data["author"] or not book_data["publisher"]):
        line = lines[i].strip()
        if line and not book_data["title"] and not line.startswith("Este documento"):
            book_data["title"] = line
        elif line and book_data["title"] and not book_data["author"] and not line.startswith("Este documento"):
            book_data["author"] = line
        elif line and book_data["title"] and book_data["author"] and not book_data["publisher"] and not line.startswith("Este documento"):
            book_data["publisher"] = line
        
        i += 1
    
    # Skip metadata lines
    meta_end_idx = 0
    for i, line in enumerate(lines):
        if "notas/fragmentos resaltados" in line:
            meta_end_idx = i + 2  # Skip this line and the next
            break
    
    # Extract quotes
    current_chapter = None
    quote_text = None
    quote_date = None
    page_number = None
    
    i = meta_end_idx
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
        
        # Detect chapter headings
        chapter_match = re.match(r'^(\d+)\.\s+(.*)', line)
        if chapter_match:
            current_chapter = line
            i += 1
            continue
            
        # Detect dates (indicating the end of a quote)
        date_match = re.search(r'(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})', line)
        if date_match:
            quote_date = line.strip()
            
            # If we have a complete quote, add it
            if quote_text:
                # Clean up the quote (remove page numbers at the beginning)
                cleaned_quote = re.sub(r'^\s*\d+\s+', '', quote_text).strip()
                
                # Only add if it's a substantive quote
                if cleaned_quote and len(cleaned_quote) > 3:
                    quote_dict = {
                        "chapter": current_chapter,
                        "text": cleaned_quote,
                        "date": quote_date
                    }
                    
                    # Add page number if available
                    if page_number:
                        quote_dict["page"] = page_number
                    
                    book_data["quotes"].append(quote_dict)
                
                # Reset for next quote
                quote_text = None
                page_number = None
            
            i += 1
            continue
        
        # Detect page numbers (often at the beginning of quotes)
        page_match = re.match(r'^(\d+)$', line)
        if page_match and not quote_text:
            page_number = line.strip()
            i += 1
            continue
        
        # If we get here, this line is part of a quote
        if not quote_text:
            quote_text = line
        else:
            quote_text += " " + line
        
        i += 1
    
    # Add the last quote if needed
    if quote_text and quote_date:
        cleaned_quote = re.sub(r'^\s*\d+\s+', '', quote_text).strip()
        if cleaned_quote and len(cleaned_quote) > 3:
            quote_dict = {
                "chapter": current_chapter,
                "text": cleaned_quote,
                "date": quote_date
            }
            
            # Add page number if available
            if page_number:
                quote_dict["page"] = page_number
            
            book_data["quotes"].append(quote_dict)
    
    # Clean up any chapters that might have been incorrectly detected in quotes
    for quote in book_data["quotes"]:
        # Fix chapter assignment based on content order
        if quote["chapter"] and "Epílogo" in quote["text"]:
            quote["chapter"] = "Epílogo"
            # Remove "Epílogo" from the quote text
            quote["text"] = quote["text"].replace("Epílogo", "").strip()
    
    # Associate URLs with quotes - ensure every quote gets matched up
    if urls:
        book_data["quotes"] = associate_urls_with_quotes(book_data["quotes"], urls)
    
    # Ensure all quotes have a "urls" key, even if empty
    for quote in book_data["quotes"]:
        if "urls" not in quote:
            quote["urls"] = []
    
    # Add a root URL for the book if needed
    book_url = None
    for url in urls:
        if "id=" in url and "GBS.PA" in url:
            # Extract the base URL without page info
            match = re.search(r'(http://play\.google\.com/books/reader\?printsec=frontcover&output=reader&id=[^&]+)', url)
            if match:
                book_url = match.group(1)
                break
    
    if book_url:
        book_data["book_url"] = book_url
    
    print(f"Found {len(urls)} content URLs in the document")
    return book_data

def main():
    # Check if file path is provided as argument
    if len(sys.argv) > 1:
        docx_path = sys.argv[1]
    else:
        # Default to the file we found in the repo
        docx_path = os.path.join(os.path.dirname(__file__), 
                                "Notas de _ Aprendiendo a vivir_ el descanso _.docx")
    
    # Convert to json
    book_data = convert_docx_to_json(docx_path)
    
    if book_data:
        # Print JSON to terminal
        json_output = json.dumps(book_data, indent=2, ensure_ascii=False)
        print(json_output)
        
        # Save to a file
        output_path = os.path.splitext(docx_path)[0] + '.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(json_output)
        print(f"JSON saved to {output_path}")

if __name__ == "__main__":
    main()
