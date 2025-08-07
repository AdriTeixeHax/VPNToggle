# VPN Toggle

Adds a button in your GNOME quick settings to toggle ON or OFF a VPN configured in `openfortivpn`.

## Prerrequisites

- A Linux distribution running GNOME as its desktop manager. Only tested in Wayland.
- GNOME Extensions

## Installation

- Install `openfortivpn`. For Arch Linux:
```bash
yay -S openfortivpn
```
- Configure `openfortivpn` by:
```bash
sudo nano /etc/openfortivpn/config
```
- Then writing:
```bash
host = <your_host>
port = <your_port>
username = <your_username>
password = <your_password>
```
- Change its permissions to be executable:
```bash
sudo chmod 600 /etc/openfortivpn/config
```

- If using `systemd`, enable `systemd-resolved`:
```bash
sudo systemctl enable --now systemd-resolved
```

- Copy the whole `vpnToggle@AdriTeixeHax` folder into `~/.local/share/gnome-shell/extensions`.
```bash
sudo cp -R vpnToggle@AdriTeixeHax ~/.local/share/gnome-shell/extensions
```
- Enable the extension in `gnome-extensions-app`