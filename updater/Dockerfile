FROM golang:1.24-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} go build -trimpath -ldflags='-s -w' -o /out/atacte-updater .

FROM alpine:3.21
RUN apk add --no-cache docker-cli docker-cli-compose ca-certificates
COPY --from=builder /out/atacte-updater /usr/local/bin/atacte-updater
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/atacte-updater"]
