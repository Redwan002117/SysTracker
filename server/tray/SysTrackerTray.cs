using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

/// <summary>
/// SysTracker Server Tray Launcher
/// Starts the server EXE as a hidden background process and provides
/// a system tray icon for controlling it.
/// Compiles with:
///   csc /target:winexe /out:SysTrackerServerLauncher.exe SysTrackerTray.cs
///       /r:System.Windows.Forms.dll /r:System.Drawing.dll
/// </summary>
[assembly: AssemblyTitle("SysTracker Server")]
[assembly: AssemblyDescription("SysTracker Server Launcher")]
[assembly: AssemblyCompany("RedwanCodes")]
[assembly: AssemblyProduct("SysTracker")]
[assembly: AssemblyVersion("3.1.6.0")]

class SysTrackerTray : ApplicationContext
{
    private NotifyIcon _trayIcon;
    private Process _serverProcess;
    private System.Windows.Forms.Timer _healthTimer;
    private bool _serverReady = false;
    private readonly string _serverExe;
    private readonly string _dashboardUrl;

    public SysTrackerTray()
    {
        _serverExe = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SysTracker-Server-Core.exe");
        _dashboardUrl = GetDashboardUrl();

        BuildTrayIcon();
        StartServer();
        StartHealthCheck();
    }

    private string GetDashboardUrl()
    {
        // Read port from .env if present
        string envFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".env");
        if (File.Exists(envFile))
        {
            foreach (var line in File.ReadAllLines(envFile))
            {
                if (line.StartsWith("PORT="))
                {
                    string port = line.Substring(5).Trim();
                    return $"http://localhost:{port}";
                }
            }
        }
        return "http://localhost:7777";
    }

    private void BuildTrayIcon()
    {
        var menu = new ContextMenuStrip();

        var title = new ToolStripMenuItem("SysTracker Server") { Enabled = false, Font = new Font("Segoe UI", 9f, FontStyle.Bold) };
        var status = new ToolStripMenuItem("⏳ Starting...") { Enabled = false, Name = "status" };
        var openDash = new ToolStripMenuItem("🌐 Open Dashboard", null, (s, e) => OpenDashboard());
        var sep = new ToolStripSeparator();
        var restart = new ToolStripMenuItem("🔄 Restart Server", null, (s, e) => RestartServer());
        var stopAll = new ToolStripMenuItem("⏹ Stop & Exit", null, (s, e) => StopAndExit());

        menu.Items.AddRange(new ToolStripItem[] { title, status, new ToolStripSeparator(), openDash, sep, restart, stopAll });

        // Try to use the embedded icon, fall back to application icon
        Icon icon;
        try
        {
            string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "systracker.ico");
            icon = File.Exists(icoPath) ? new Icon(icoPath) : SystemIcons.Application;
        }
        catch { icon = SystemIcons.Application; }

        _trayIcon = new NotifyIcon
        {
            Icon = icon,
            Text = "SysTracker Server — Starting...",
            Visible = true,
            ContextMenuStrip = menu
        };
        _trayIcon.DoubleClick += (s, e) => OpenDashboard();
    }

    private void StartServer()
    {
        if (!File.Exists(_serverExe))
        {
            MessageBox.Show($"Server executable not found:\n{_serverExe}\n\nPlease reinstall SysTracker Server.",
                "SysTracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Application.Exit();
            return;
        }

        try
        {
            _serverProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = _serverExe,
                    WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = false,
                    RedirectStandardError = false
                },
                EnableRaisingEvents = true
            };
            _serverProcess.Exited += OnServerExited;
            _serverProcess.Start();
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Failed to start server:\n{ex.Message}", "SysTracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Application.Exit();
        }
    }

    private void StartHealthCheck()
    {
        _healthTimer = new System.Windows.Forms.Timer { Interval = 3000 };
        _healthTimer.Tick += async (s, e) => await CheckHealth();
        _healthTimer.Start();
    }

    private async Task CheckHealth()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            var response = await client.GetAsync(_dashboardUrl);
            if (!_serverReady)
            {
                _serverReady = true;
                UpdateStatus("✅ Running", "SysTracker Server — Running");
                _trayIcon.ShowBalloonTip(3000, "SysTracker Server", $"Server is ready!\n{_dashboardUrl}", ToolTipIcon.Info);
            }
        }
        catch
        {
            if (_serverReady)
            {
                _serverReady = false;
                UpdateStatus("⚠️ Unreachable", "SysTracker Server — Unreachable");
            }
        }
    }

    private void UpdateStatus(string menuText, string tooltipText)
    {
        if (_trayIcon.ContextMenuStrip.InvokeRequired)
        {
            _trayIcon.ContextMenuStrip.Invoke(new Action(() => UpdateStatus(menuText, tooltipText)));
            return;
        }
        var item = _trayIcon.ContextMenuStrip.Items["status"] as ToolStripMenuItem;
        if (item != null) item.Text = menuText;
        _trayIcon.Text = tooltipText.Length > 63 ? tooltipText.Substring(0, 63) : tooltipText;
    }

    private void OnServerExited(object sender, EventArgs e)
    {
        _serverReady = false;
        UpdateStatus("❌ Stopped", "SysTracker Server — Stopped");
        _trayIcon.ShowBalloonTip(3000, "SysTracker", "Server stopped unexpectedly. Right-click to restart.", ToolTipIcon.Warning);
    }

    private void OpenDashboard()
    {
        try { Process.Start(new ProcessStartInfo(_dashboardUrl) { UseShellExecute = true }); }
        catch (Exception ex) { MessageBox.Show("Could not open browser:\n" + ex.Message, "SysTracker"); }
    }

    private void RestartServer()
    {
        _serverReady = false;
        UpdateStatus("⏳ Restarting...", "SysTracker Server — Restarting...");
        try { _serverProcess?.Kill(); } catch { }
        Thread.Sleep(1500);
        StartServer();
    }

    private void StopAndExit()
    {
        _healthTimer?.Stop();
        _trayIcon.Visible = false;
        try { _serverProcess?.Kill(); } catch { }
        Application.Exit();
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _healthTimer?.Dispose();
            _trayIcon?.Dispose();
        }
        base.Dispose(disposing);
    }
}

static class Program
{
    [STAThread]
    static void Main()
    {
        // Single instance guard
        bool createdNew;
        using var mutex = new Mutex(true, "SysTrackerServerLauncher", out createdNew);
        if (!createdNew)
        {
            MessageBox.Show("SysTracker Server is already running.\nCheck the system tray.", "SysTracker", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new SysTrackerTray());
    }
}
