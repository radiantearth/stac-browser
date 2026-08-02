FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /app
COPY StacSearch.csproj .
RUN dotnet restore
ENTRYPOINT ["sh", "-c", "if [ -n \"$INSTALL_DEPS\" ]; then eval \"$INSTALL_DEPS\"; fi && cp /code/Program.cs . && dotnet run --no-restore"]
