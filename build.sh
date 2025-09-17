# rm -rf Dockerfile

# mv Dockerfile-new Dockerfile

docker buildx build . --output type=docker,name=chgochad/serpbear:latest | docker load
