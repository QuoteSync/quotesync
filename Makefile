include .env
export $(shell sed 's/=.*//' .env)

DC = docker compose exec -u `id -u`:`id -g` backend
MANAGE = $(DC) python3 /app/manage.py

.PHONY: make migrations migrate dev-serve bash dj-shell db initdb build logs init

make: migrations migrate dev-serve

migrate:
	$(MANAGE) migrate
	$(MANAGE) migrate api

migrations:
	$(MANAGE) makemigrations
	$(MANAGE) makemigrations api

collectstatic:
	$(MANAGE) collectstatic --noinput

create-admin:
	$(MANAGE) createsuperuser --username admin
	$(MANAGE) shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(username='admin'); user.first_name = 'Admin'; user.last_name = 'Admin'; user.is_superuser = True; user.is_staff = True; user.save();"

dev-serve:
	docker compose up -d
	$(MANAGE) collectstatic --noinput

bash:
	$(DC) bash

dj-shell:
	$(MANAGE) shell

db:
	docker compose exec -u postgres db psql -U quotesync_user quotesync

initdb:
	docker compose up -d db
	sleep 5
	docker compose exec db pg_isready -t 15
	docker compose exec -u postgres db sh -c "createuser -S -R --createdb quotesync_user && psql -c \"ALTER ROLE quotesync_user WITH PASSWORD '$(POSTGRES_PASSWORD)'\""
	docker compose exec -u postgres db createdb quotesync
	docker compose exec -u postgres db sh -c 'psql -c "grant all on database quotesync to quotesync_user"'
	docker compose exec -u postgres db sh -c 'psql -c "grant all on schema public to quotesync_user" quotesync'
	docker compose exec -u postgres db sh -c 'psql -c "create extension pg_trgm;" quotesync'
	docker compose exec -u postgres db sh -c 'psql -c "create extension pg_trgm;" template1'

build:
	docker compose build
	$(MAKE) dev-serve

logs:
	docker compose logs --tail=100 -f backend

init: .env
	-mkdir -p backend/static
	$(MAKE) initdb
	docker compose build
	docker compose up -d
	$(MAKE) migrate
	$(MAKE) collectstatic
	$(MAKE) create-admin

# Frontend commands
frontend-install:
	docker compose exec frontend npm install

frontend-dev:
	docker compose exec frontend npm run dev

frontend-build:
	docker compose exec frontend npm run build

# Database backup and restore
backup:
	docker compose exec -u postgres db pg_dump -U quotesync_user quotesync > backup_$(shell date +%Y%m%d_%H%M%S).sql

restore:
	docker compose exec -u postgres db psql -U quotesync_user quotesync < $(BACKUP_FILE)

# Clean up
clean:
	docker compose down -v
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete

# Test commands
test:
	docker compose exec backend python manage.py test

# Development utilities
shell-plus:
	$(MANAGE) shell_plus

showmigrations:
	$(MANAGE) showmigrations

check:
	$(MANAGE) check 