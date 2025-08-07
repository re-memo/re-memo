# Use Ubuntu 22.04 as base image with additional tools
FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV NODE_VERSION=20
ENV PYTHON_VERSION=3.11

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Essential build tools
    build-essential \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release \
    # PostgreSQL client and development libraries
    postgresql-client \
    postgresql-contrib \
    libpq-dev \
    # pip
    python3-pip \
    # Additional tools
    vim \
    nano \
    htop \
    jq \
    tree \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install global Node.js tools
RUN npm install -g \
    yarn \
    pnpm \
    @vscode/vsce \
    nodemon \
    concurrently

# Install Python packages globally
RUN pip3 install --upgrade pip setuptools wheel

# Alias for Python 3.11
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 1
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Set up workspace permissions
RUN mkdir -p /workspace && chown -R vscode:vscode /workspace
RUN mkdir -p /app/embedding_models && chown -R vscode:vscode /app/embedding_models

# Switch to vscode user
USER vscode

# Set working directory
WORKDIR /workspace

# Copy requirements.txt
COPY --from=backend requirements.txt /tmp/requirements.txt

# Install Python dependencies
RUN pip3 install --no-cache-dir --user -r /tmp/requirements.txt

# Expose ports
EXPOSE 3000 8080