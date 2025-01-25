sudo apt-get install build-essential net-tools

wget -q https://github.com/cdr/code-server/releases/download/3.4.1/code-server_3.4.1_amd64.deb

#https://github.com/cdr/code-server/releases/download/

sudo dpkg -i code-server_3.4.1_amd64.deb

code-server --install-extension ms-vscode.cpptools ms-vscode.cpptools formulahendry.terminal hookyqr.beautify

#cat ~/.config/code-server/config.yaml

#cat ~/.bashrc

sudo ufw allow 8080

code-server --host 0.0.0.0 --port 8080
