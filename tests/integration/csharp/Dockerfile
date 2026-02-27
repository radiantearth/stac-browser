FROM mcr.microsoft.com/dotnet/sdk:8.0
WORKDIR /app
COPY StacSearch.csproj .
RUN dotnet restore
ENTRYPOINT ["bash", "-c", "cp /code/Program.cs . && dotnet run --no-restore"]
