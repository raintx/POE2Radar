using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;

namespace POE2Radar.Overlay.UI;

public class DebugForm : Form
{
    private TextBox _logTextBox = null!;
    private NotifyIcon _notifyIcon = null!;
    private ContextMenuStrip _trayMenu = null!;

    public DebugForm()
    {
        InitializeComponents();
        RedirectConsole();
    }

    private void InitializeComponents()
    {
        this.Text = "POE2Radar - Debug Window";
        this.Size = new Size(800, 600);
        this.BackColor = Color.FromArgb(30, 30, 30);
        this.ForeColor = Color.LightGray;
        this.StartPosition = FormStartPosition.CenterScreen;

        _logTextBox = new TextBox
        {
            Multiline = true,
            Dock = DockStyle.Fill,
            ReadOnly = true,
            ScrollBars = ScrollBars.Vertical,
            BackColor = Color.FromArgb(20, 20, 20),
            ForeColor = Color.FromArgb(200, 200, 200),
            Font = new Font("Consolas", 10F, FontStyle.Regular, GraphicsUnit.Point)
        };
        this.Controls.Add(_logTextBox);

        _trayMenu = new ContextMenuStrip();
        _trayMenu.Items.Add("Mostrar/Ocultar", null, OnTrayDoubleClicked);
        _trayMenu.Items.Add(new ToolStripSeparator());
        _trayMenu.Items.Add("Sair (Exit)", null, OnExitClicked);

        _notifyIcon = new NotifyIcon
        {
            Text = "POE2Radar (Double click to open)",
            Icon = SystemIcons.Application,
            ContextMenuStrip = _trayMenu,
            Visible = true
        };
        _notifyIcon.DoubleClick += OnTrayDoubleClicked;

        this.FormClosing += OnFormClosing;
    }

    private void RedirectConsole()
    {
        var writer = new TextBoxWriter(_logTextBox);
        Console.SetOut(writer);
        Console.SetError(writer);
    }

    private void OnTrayDoubleClicked(object? sender, EventArgs e)
    {
        if (this.Visible)
        {
            this.Hide();
        }
        else
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.Activate();
        }
    }

    private void OnExitClicked(object? sender, EventArgs e)
    {
        _notifyIcon.Visible = false;
        _notifyIcon.Dispose();
        Environment.Exit(0);
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs e)
    {
        if (e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            this.Hide();
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _notifyIcon?.Dispose();
        }
        base.Dispose(disposing);
    }
}

public class TextBoxWriter : TextWriter
{
    private readonly TextBox _textBox;

    public TextBoxWriter(TextBox textBox)
    {
        _textBox = textBox;
    }

    public override void Write(char value)
    {
        AppendText(value.ToString());
    }

    public override void Write(string? value)
    {
        if (value != null) AppendText(value);
    }

    public override void WriteLine(string? value)
    {
        if (value != null) AppendText(value + Environment.NewLine);
        else AppendText(Environment.NewLine);
    }

    private void AppendText(string text)
    {
        if (_textBox.IsDisposed) return;
        
        if (_textBox.InvokeRequired)
        {
            _textBox.BeginInvoke(new Action(() => AppendTextSafe(text)));
        }
        else
        {
            AppendTextSafe(text);
        }
    }

    private void AppendTextSafe(string text)
    {
        _textBox.AppendText(text);
        // Autoscroll logic if needed
    }

    public override Encoding Encoding => Encoding.UTF8;
}
