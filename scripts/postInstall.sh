set env vars
set -o allexport; source .env; set +o allexport;

sleep 10s;

sed -i 's|{"scraper_type":"none","notification_interval":"never","notification_email":"","smtp_server":"","smtp_port":"","smtp_username":"","smtp_password":""}|{"scraper_type":"none","notification_interval":"daily","notification_email":"'${ADMIN_EMAIL}'","smtp_server":"'${SMTP_SERVER}'","smtp_port":"'${SMTP_PORT}'","smtp_username":"'${SMTP_USER}'","smtp_password":"'${SMTP_PASSWORD}'","scaping_api":"","search_console_integrated":false,"available_scapers":[{"label":"Scraping Robot","value":"scrapingrobot"},{"label":"ScrapingAnt","value":"scrapingant"},{"label":"SerpApi.com","value":"serpapi"},{"label":"Serply","value":"serply"},{"label":"Proxy","value":"proxy"}],"notification_email_from":"'${SMTP_FROM}'"}|g' ./data/settings.json
