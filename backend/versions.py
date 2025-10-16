import os, google.generativeai as genai
os.environ.get("GEMINI_API_KEY") or print("No GEMINI_API_KEY set")
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
mods = list(genai.list_models())
for m in mods:
    print(m.name, getattr(m, "supported_generation_methods", []))
    