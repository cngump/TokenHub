FROM golang:1.26-alpine AS builder

WORKDIR /src
ARG GOPROXY=https://proxy.golang.org,direct
ENV GOPROXY=$GOPROXY
RUN apk add --no-cache gcc musl-dev
COPY backend/go.mod ./backend/go.mod
COPY backend/go.sum ./backend/go.sum
COPY backend/cmd ./backend/cmd
COPY backend/internal ./backend/internal
COPY data/model-catalog.yaml ./catalog/model-catalog.yaml
RUN cd backend && CGO_ENABLED=1 GOOS=linux go build -o /out/tokenhub ./cmd/tokenhub

FROM alpine:3.20

RUN apk add --no-cache sqlite-libs && adduser -D -H tokenhub && mkdir -p /app/data /app/catalog && chown -R tokenhub:tokenhub /app
USER tokenhub
WORKDIR /app
COPY --from=builder /out/tokenhub /app/tokenhub
COPY --from=builder --chown=tokenhub:tokenhub /src/catalog/model-catalog.yaml /app/catalog/model-catalog.yaml
EXPOSE 8080
ENTRYPOINT ["/app/tokenhub"]
