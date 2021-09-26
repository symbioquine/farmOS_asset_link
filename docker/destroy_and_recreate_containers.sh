#!/bin/bash

set -e

# Stop and remove my old containers and their data (Note: this is destructive and I'm only doing it in my local development environment)
docker-compose stop db www
docker-compose rm db www
sudo rm -rf db www

docker-compose up -d

# while { ! exec 3<>/dev/tcp/www/80; } > /dev/null 2>&1; do sleep 0.1; done

# OAUTH2_ACCESS_TOKEN=`curl --silent -X POST -d "grant_type=password&username=root&password=test&client_id=farm&scope=openid" http://localhost/oauth/token | grep -Po 'access_token":"\K[^"]+'`

# SHEEP_ANIMAL_TYPE_ID=`curl --silent --header "Authorization: Bearer $OAUTH2_ACCESS_TOKEN" "http://localhost/api/taxonomy_term/animal_type" -H "Content-Type: application/vnd.api+json" -H "Accept: application/vnd.api+json" -X POST -d '{"data": {"type": "taxonomy_term--animal_type", "attributes": {"name": "Sheep"}, "relationships": {}}}' | jq -r '.data.id'`

# curl --silent --header "Authorization: Bearer $OAUTH2_ACCESS_TOKEN" "http://localhost/api/asset/animal" -H "Content-Type: application/vnd.api+json" -H "Accept: application/vnd.api+json" -X POST -d '{"data": {"type": "asset--animal", "attributes": {"name": "Dolly"}, "relationships": {"animal_type": {"data": {"type": "taxonomy_term--animal_type", "id": "'$SHEEP_ANIMAL_TYPE_ID'"}}}}}' | jq -r '.data.id'
