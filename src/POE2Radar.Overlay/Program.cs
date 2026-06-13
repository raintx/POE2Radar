using POE2Radar.Core;
using POE2Radar.Overlay;
using POE2Radar.Overlay.UI;
using System.Threading;
using System.Windows.Forms;

Application.EnableVisualStyles();
Application.SetCompatibleTextRenderingDefault(false);

var debugForm = new DebugForm();

Console.WriteLine("POE2Radar — map/radar overlay");
Console.WriteLine("=============================");
Console.WriteLine("Double-click tray icon to hide/show this window. Right-click to exit.");
Console.WriteLine("Calibrate projection: PageUp/PageDown = scale, Arrow keys = offset, Home = reset.\n");

var radarThread = new Thread(() =>
{
    while (true)
    {
        Console.WriteLine("Waiting for Path of Exile 2 to start...");
        ProcessHandle? process = null;
        while ((process = ProcessHandle.AttachToPoE()) == null)
        {
            Thread.Sleep(2000);
        }

        Console.WriteLine($"Attached to {process.ProcessName} (PID {process.ProcessId})");

        var reader = new MemoryReader(process);
        
        bool waitingForLoginMsgShown = false;
        while (true)
        {
            bool hasExited = false;
            try { hasExited = System.Diagnostics.Process.GetProcessById(process.ProcessId).HasExited; } 
            catch { hasExited = true; }
            if (hasExited) break;

            var slot = Bootstrap.ResolveGameStateSlot(process, reader, quiet: true);
            if (slot != 0)
            {
                Console.WriteLine("Radar running. Open the in-game map to see terrain + entities.");
                try
                {
                    using var app = new RadarApp(process, reader, slot);
                    app.Run();
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"RadarApp loop crashed: {ex.Message}");
                }
                break; // Exit the loop when RadarApp returns (e.g. game closed)
            }
            else
            {
                if (!waitingForLoginMsgShown)
                {
                    Console.WriteLine("Waiting for you to log into a character...");
                    waitingForLoginMsgShown = true;
                }
                Thread.Sleep(3000);
            }
        }

        process.Dispose();
        Console.WriteLine("\nGame closed or disconnected. Waiting for it to reopen...");
        Thread.Sleep(2000);
    }
})
{
    IsBackground = true,
    Name = "POE2Radar.Main"
};
radarThread.Start();

Application.Run(debugForm);

return 0;
