# Clones and installs the Automatic1111 stable diffusion web ui for a given vault
cd $1
ls
git clone $2

sed '6i--api --nowebui' ./stable-diffusion-webui/webui-user.bat

echo "export COMMANDLINE_ARGS=\"--api --nowebui\"" >> ./stable-diffusion-webui/webui-user.sh

# if [[ "$OSTYPE" == "linux-gnu"* ]]; then
#   # For now assuming it's debian based
#   # sudo apt install wget git python3 python3-venv libgl1 libglib2.0-0 -y
# fi