#!/usr/bin/env python3
"""
TeioOS mDNS Alias Publisher
===========================
Publishes 'teioos-server.local' -> <Host_IP> over local multicast DNS (mDNS)
without changing the machine's actual system hostname.

Cross-platform equivalent to Linux's:
    avahi-publish -a -R teioos-server.local <IP>

Usage:
    python scripts/publish_mdns.py [IP_ADDRESS] [--host HOSTNAME] [--port PORT]

Examples:
    python scripts/publish_mdns.py
    python scripts/publish_mdns.py 192.168.1.50
    python scripts/publish_mdns.py 192.168.122.1 --host teioos-server.local --port 8080
"""

import argparse
import socket
import sys
import time

try:
    from zeroconf import IPVersion, ServiceInfo, Zeroconf
except ImportError:
    print("[ERROR] 'zeroconf' package is not installed.")
    print("Please install it with: pip install zeroconf")
    sys.exit(1)


def get_default_ip() -> str:
    """Detects the default outbound LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def main():
    parser = argparse.ArgumentParser(
        description="Publish teioos-server.local mDNS alias without changing machine hostname."
    )
    parser.add_argument(
        "ip",
        nargs="?",
        default=None,
        help="Target IP to publish (defaults to auto-detected LAN IP)",
    )
    parser.add_argument(
        "--host",
        default="teioos-server.local",
        help="mDNS hostname to publish (default: teioos-server.local)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Service port to advertise (default: 8080)",
    )
    args = parser.parse_args()

    target_ip = args.ip or get_default_ip()
    hostname = args.host.rstrip(".") + "."

    print("============================================================")
    print(" TeioOS mDNS Alias Broadcaster")
    print("============================================================")
    print(f" System Hostname : {socket.gethostname()} (Unchanged)")
    print(f" mDNS Alias      : {args.host}")
    print(f" Target IP       : {target_ip}")
    print(f" Target Port     : {args.port}")
    print("============================================================")

    zc = Zeroconf(ip_version=IPVersion.V4Only)

    instance_name = "TeioOS Gateway._http._tcp.local."

    info = ServiceInfo(
        "_http._tcp.local.",
        instance_name,
        addresses=[socket.inet_aton(target_ip)],
        port=args.port,
        properties={"path": "/exam/login/"},
        server=hostname,
    )

    try:
        zc.register_service(info)
        print(f"[SUCCESS] '{args.host}' is now resolving to {target_ip}")
        print("[INFO] Press Ctrl+C to stop broadcasting.\n")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping mDNS broadcaster...")
    finally:
        zc.unregister_service(info)
        zc.close()
        print("[INFO] Broadcaster stopped cleanly.")


if __name__ == "__main__":
    main()
