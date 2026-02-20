# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['client_agent.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'socketio',
        'engineio',
        'websocket',
        'psutil',
        'requests',
        'urllib3',
        'win32evtlog',
        'win32api',
        'win32con',
        'win32security',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SysTracker_Agent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['logo.ico'],
)
