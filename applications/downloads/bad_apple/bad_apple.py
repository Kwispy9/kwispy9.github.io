import os
import sys
import time
import getpass
import threading
import playsound
import urllib.request
from tqdm import tqdm
import importlib.util, types
hide_debug = True

FPS = 30
frame_time = 1 / FPS
frame_num = 1

current_time = 0
total_time = 28435

external_files = [
    ("frames.py", "https://kwispy9.github.io/applications/downloads/bad_apple/frames.py"),
    ("frames2.py", "https://kwispy9.github.io/applications/downloads/bad_apple/frames2.py"),
    ("bad_apple.wav", "https://drive.google.com/uc?export=download&id=1dQULNxgPfK-0VdJJO7_bMekR2nHRaiVO")
]

def download_files(url, path):
    with tqdm(unit='B', unit_scale=True, unit_divisor=1024, miniters=1, desc=f"Downloading {os.path.basename(path)}") as t:
        def reporthook(block_num, block_size, total_size):
            if total_size > 0:
                t.total = total_size
            t.update(block_size)
        urllib.request.urlretrieve(url, path, reporthook=reporthook)

def format_time(seconds):
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"

def pad_frame(frame):
    lines = frame.splitlines()
    lines = [line.ljust(max_width) for line in lines]
    while len(lines) < max_lines:
        lines.append(" " * max_width)
    return "\n".join(lines)

def start_music():
    playsound.playsound(f"{RESOURCES}/bad_apple.wav","r")

def animation():
    global frame_num, timestamp
    print("\033[?25l", end="")  # hide cursor
    try:
        next_frame = time.perf_counter()

        for i, frame_text in enumerate(frames_module.frames):
            repeat = 42 if i == 0 else 1   # hold first frame visually

            for _ in range(repeat):
                seconds = int(frame_num / FPS)
                timestamp = format_time(seconds)
                print("\033[H", end="")
                print(f"\033[47m\033[30m{frame_text}\n\033[0mframe {frame_num}/6572\n{timestamp}/03:39\n~30fps", end="", flush=True)
                next_frame += frame_time
                sleep_time = next_frame - time.perf_counter()
                if sleep_time > 0:
                    time.sleep(sleep_time)
                frame_num += 1
    finally:
        print("\033[?25h")  # show cursor

def clear():
    os.system("cls" if os.name == "nt" else "clear")

def get_online_version():
    url = "https://kwispy9.github.io/applications/downloads/bad_apple/version.txt"
    with urllib.request.urlopen(url) as response:
        return response.read().decode().strip()
def get_local_version(path):
    if not os.path.exists(path):
        return None
    with open(path, "r") as f:
        return f.read().strip()
def save_local_version(path, version):
    with open(path, "w") as f:
        f.write(version)
clear()
hide_debug = input("Show debug info? [Y/N] (leave blank to keep default (N/No))\n> ").strip().lower()
if hide_debug == "y" or hide_debug == "yes":
    hide_debug = False
else:
    hide_debug = True

clear()
STOP_EDGING_ME = input("Soft or hard edges? [S/H] (leave blank to keep default (soft))\n> ").strip().lower()
if STOP_EDGING_ME == "h" or STOP_EDGING_ME == "hard":
    mode = "hard"
else:
    mode = "soft"

print("\033[?25l")
clear()

# Determine base_dir and ensure resources folder exists
appdata = os.environ.get("APPDATA")
if appdata:
    base_dir = os.path.join(appdata, "Bad Apple in Python")
else:
    base_dir = os.path.dirname(__file__)

RESOURCES = os.path.join(base_dir, "resources")
os.makedirs(RESOURCES, exist_ok=True)

version_path = os.path.join(RESOURCES, "version.txt")
online_version = get_online_version()
local_version = get_local_version(version_path)

# print("Checking for updates...")
# if online_version != local_version:
#     print("Downloading resources...")
#     for filename, url in external_files:
#         path = os.path.join(RESOURCES, filename)
#         download_files(url, path)
#     save_local_version(version_path, online_version)
# else:
#     print("No new updates detected.")

# sys.path.append(RESOURCES)


if mode == "soft":
    frames_path = os.path.join(RESOURCES, "frames.py")
    spec = importlib.util.spec_from_file_location("frames", frames_path)
else:
    frames_path = os.path.join(RESOURCES, "frames2.py")
    spec = importlib.util.spec_from_file_location("frames2", frames_path)

frames_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(frames_module)

max_lines = max(frame.count("\n") + 1 for frame in frames_module.frames)
max_width = max(max(len(line) for line in frame.splitlines()) for frame in frames_module.frames)


print(f"\nsys.frozen: {getattr(sys, 'frozen', False)}")
print(f"APPDATA env: {os.environ.get('APPDATA')}\n")

print(f"Base dir: {base_dir}")
print(f"RESOURCES dir exists: {os.path.exists(RESOURCES)}")
print(f"version.txt exists: {os.path.exists(version_path)}")

if hide_debug:
    clear()
os.system("title Bad Apple")
print("""
\033[A████▄ ▄███▄ ████▄      █▀    
██ ██ ██ ██ ██ ██  ▄███████▄ 
████▀ ██ ██ ██ ██  █▀  ▀  ▀█ 
██ ██ █████ ██ ██  █  █ █  █ 
██ ██ ██ ██ ██ ██  ▀█  ▄  █▀ 
████▀ ██ ██ ████▀   ███▀███  
                             
▄███▄ ████▄ ████▄ ██    █████
██ ██ ██ ██ ██ ██ ██    ██   
██ ██ ████▀ ████▀ ██    ████ 
█████ ██    ██    ██    ██   
██ ██ ██    ██    ██    ██   
██ ██ ██    ██    █████ █████
Original animation length: 00:03:39
""")
print("Use 'CTRL + C' to cancel or stop the animation\n(Or close the terminal, that works, too)")
try:
    getpass.getpass("\033[47m\033[30m[START ANIMATION]\033[0m\033[?25l (press enter)")
    print("\033[A[START ANIMATION]")
    print("Loading animation frames...")

    clear()
    music = threading.Thread(target=start_music, daemon=True)
    music.start() # start music in a separate thread as to not interrupt the animation

    frames_module.frames = [pad_frame(f) for f in frames_module.frames] # make sure all frames are the same size, if not, make it so
    animation() # starts the animation (duh)

    print(f"\033[A\033[A\033[Aended on frame {frame_num}/6572\n\n\033[?25h\n\nThat's it for now.")
    print("Done.")
    getpass.getpass("\033[47m\033[30m[FINISH]\033[0m\033[?25l\033[0m (or listen to the rest of this peak song)")
    print("\033[A[FINISH]\033[?25h")
finally:
    print("\033[?25h")