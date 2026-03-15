FROM python:slim
WORKDIR /code
ENTRYPOINT ["sh", "-c", "if [ -n \"$INSTALL_DEPS\" ]; then eval \"$INSTALL_DEPS\"; fi && python search.py"]
