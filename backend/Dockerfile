FROM golang:1.26-alpine AS builder

WORKDIR /src
RUN apk add --no-cache gcc musl-dev
COPY go.mod ./
COPY go.sum ./
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/tokenhub ./cmd/tokenhub

FROM alpine:3.20

RUN apk add --no-cache sqlite-libs && adduser -D -H tokenhub && mkdir -p /app/data && chown -R tokenhub:tokenhub /app
USER tokenhub
WORKDIR /app
COPY --from=builder /out/tokenhub /app/tokenhub
EXPOSE 8080
ENTRYPOINT ["/app/tokenhub"]
