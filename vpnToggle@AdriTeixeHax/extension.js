// extension.js
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {QuickToggle, SystemIndicator} from 'resource:///org/gnome/shell/ui/quickSettings.js';

const ScriptToggle = GObject.registerClass(
class ScriptToggle extends QuickToggle {
    _init(extensionPath) {
        super._init({
            title: 'VPN Toggle',
            iconName: 'network-vpn-symbolic',
            toggleMode: true, // Changed back to true for toggle behavior
        });
        
        this._extensionPath = extensionPath;
        this.checked = false;
        this.connect('clicked', this._onToggle.bind(this));
    }

    _onToggle() {
        if (this.checked) {
            this._runScript('vpn_on.sh');
            this.subtitle = 'Connected';
        } else {
            this._runScript('vpn_off.sh');
            this.subtitle = 'Disconnected';
        }
    }

    _runScript(scriptName) {
        const scriptPath = `${this._extensionPath}/${scriptName}`;
        
        try {
            // Check if script exists and is executable
            const file = Gio.File.new_for_path(scriptPath);
            if (!file.query_exists(null)) {
                Main.notify('Script Runner', `Script not found: ${scriptPath}`);
                return;
            }

            // Use pkexec for GUI sudo prompt, fallback to direct execution
            let command;
            if (scriptName.includes('sudo') || this._requiresSudo(scriptPath)) {
                // Run with pkexec for sudo access
                command = ['pkexec', '/bin/bash', scriptPath];
                // Main.notify('Script Runner', `Running ${scriptName} with elevated privileges...`);
            } else {
                // Run normally
                command = ['/bin/bash', scriptPath];
            }

            // Run the script
            const subprocess = Gio.Subprocess.new(
                command,
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            // Handle script completion
            subprocess.wait_async(null, (proc, result) => {
                try {
                    const success = proc.wait_finish(result);
                    if (success) {
                        // Main.notify('Script Runner', `${scriptName} executed successfully`);
                    } else {
                        Main.notify('Script Runner', `${scriptName} execution failed (cancelled or error)`);
                    }
                } catch (e) {
                    Main.notify('Script Runner', `${scriptName} error: ${e.message}`);
                }
            });

        } catch (e) {
            Main.notify('Script Runner', `Failed to run ${scriptName}: ${e.message}`);
        }
    }

    _requiresSudo(scriptPath) {
        try {
            // Read first few lines of script to check for sudo commands
            const file = Gio.File.new_for_path(scriptPath);
            const [success, contents] = file.load_contents(null);
            if (success) {
                const scriptContent = new TextDecoder().decode(contents);
                // Check if script contains sudo commands
                return scriptContent.includes('sudo ') || 
                       scriptContent.includes('systemctl ') ||
                       scriptContent.includes('# REQUIRES_SUDO');
            }
        } catch (e) {
            // If we can't read the file, assume no sudo needed
        }
        return false;
    }
});

const ScriptIndicator = GObject.registerClass(
class ScriptIndicator extends SystemIndicator {
    _init(extensionPath) {
        super._init();

        this._indicator = this._addIndicator();
        this._indicator.iconName = 'network-vpn-symbolic';
        this._indicator.visible = false;

        this.quickSettingsItems.push(new ScriptToggle(extensionPath));
    }
});

export default class ScriptRunnerExtension {
    constructor() {
        this._indicator = null;
    }

    enable() {
        // Get the extension's directory path
        const extensionPath = import.meta.url.replace('file://', '').replace('/extension.js', '');
        
        this._indicator = new ScriptIndicator(extensionPath);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.quickSettingsItems.forEach(item => item.destroy());
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
