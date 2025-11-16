FROM python:3.13-slim

ARG NEXUS_PYPI_INDEX_URL

ENV HOME="/dude"
ENV PYTHONPATH=$HOME

RUN groupadd -g 999 dudes && \
    useradd -u 999 -m -g dudes -s /bin/bash dude && \
    mkdir -p ${HOME} && chown dude:dudes $HOME

RUN mkdir -p /var/lib/app/storage && chown -R dude:dudes /var/lib/app

WORKDIR ${HOME}

RUN apt-get update && apt-get install -y curl build-essential netcat-openbsd \
    gcc \
    libpq-dev \
    cargo \
    rustc \
    gosu \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install -i "${NEXUS_PYPI_INDEX_URL:-https://pypi.org/simple}" --disable-pip-version-check --no-cache-dir uv

COPY --chown=dude:dudes ./requirements.txt ${HOME}/

RUN uv pip install --system --index-url "${NEXUS_PYPI_INDEX_URL:-https://pypi.org/simple}" -r requirements.txt

COPY --chown=dude:dudes ./service ${HOME}/service
COPY --chown=dude:dudes ./alembic ${HOME}/alembic
COPY --chown=dude:dudes ./entrypoints.sh ${HOME}
COPY ./docker-entrypoint.sh ${HOME}

RUN chmod +x ${HOME}/entrypoints.sh ${HOME}/docker-entrypoint.sh

ENTRYPOINT ["/dude/docker-entrypoint.sh"]

CMD ["server"]
