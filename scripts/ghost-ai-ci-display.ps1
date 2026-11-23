# Ghost AI by Brendigo
# Request a real Windows desktop mode large enough for 1440x900 screenshots.
# Never fake, composite or resize screenshots to satisfy visual quality gates.
param(
  [int]$MinWidth = 1440,
  [int]$MinHeight = 900
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class GhostAiCiDisplayMode {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct DEVMODE {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string dmDeviceName;
    public ushort dmSpecVersion, dmDriverVersion, dmSize, dmDriverExtra;
    public uint dmFields;
    public int dmPositionX, dmPositionY;
    public uint dmDisplayOrientation, dmDisplayFixedOutput;
    public short dmColor, dmDuplex, dmYResolution, dmTTOption, dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string dmFormName;
    public ushort dmLogPixels;
    public uint dmBitsPerPel, dmPelsWidth, dmPelsHeight, dmDisplayFlags,
      dmDisplayFrequency, dmICMMethod, dmICMIntent, dmMediaType,
      dmDitherType, dmReserved1, dmReserved2, dmPanningWidth, dmPanningHeight;
  }

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  private static extern bool EnumDisplaySettings(string deviceName, int modeNum, ref DEVMODE devMode);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  private static extern int ChangeDisplaySettings(ref DEVMODE devMode, int flags);

  public static string SetMinimum(int minWidth, int minHeight) {
    // Keep room for the taskbar because screenshots check WorkingArea.
    int requiredHeight = minHeight + 64;
    var modes = new List<DEVMODE>();
    for (int index = 0; index < 512; index++) {
      var mode = new DEVMODE();
      mode.dmSize = (ushort)Marshal.SizeOf(typeof(DEVMODE));
      if (!EnumDisplaySettings(null, index, ref mode)) break;
      if (mode.dmPelsWidth >= minWidth && mode.dmPelsHeight >= requiredHeight
          && mode.dmBitsPerPel >= 24) modes.Add(mode);
    }
    modes.Sort((a, b) =>
      ((long)a.dmPelsWidth * a.dmPelsHeight).CompareTo((long)b.dmPelsWidth * b.dmPelsHeight));
    foreach (var mode in modes) {
      var selected = mode;
      // Preserve supported refresh rate and display flags from Windows.
      int result = ChangeDisplaySettings(ref selected, 0);
      if (result == 0)
        return "Windows switched to supported mode " + selected.dmPelsWidth + "x" + selected.dmPelsHeight;
      Console.WriteLine("Display mode " + selected.dmPelsWidth + "x" +
                        selected.dmPelsHeight + " rejected (" + result + ")");
    }
    throw new InvalidOperationException(
      "NOT VERIFIED: CI display driver has no accepted mode for " +
      minWidth + "x" + requiredHeight +
      ". Use an interactive runner with the required desktop resolution.");
  }
}
'@
$workingArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
Write-Host "Desktop before: $($workingArea.Width)x$($workingArea.Height)"
if ($workingArea.Width -lt $MinWidth -or $workingArea.Height -lt $MinHeight) {
  Write-Host ([GhostAiCiDisplayMode]::SetMinimum($MinWidth, $MinHeight))
  Start-Sleep -Seconds 3
}
$workingArea = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
Write-Host "Desktop after: $($workingArea.Width)x$($workingArea.Height)"
if ($workingArea.Width -lt $MinWidth -or $workingArea.Height -lt $MinHeight) {
  throw ("NOT VERIFIED: Windows work area " + $workingArea.Width + "x" + $workingArea.Height +
         " remains below required " + $MinWidth + "x" + $MinHeight)
}
