![SerpBear](https://i.imgur.com/0S2zIH3.png) 
# SerpBear

![Codacy Badge](https://app.codacy.com/project/badge/Grade/7e7a0030c3f84c6fb56a3ce6273fbc1d) ![GitHub](https://img.shields.io/github/license/towfiqi/serpbear) ![GitHub package.json version](https://img.shields.io/github/package-json/v/towfiqi/serpbear) ![Docker Pulls](https://img.shields.io/docker/pulls/towfiqi/serpbear)

#### [Documentation](https://docs.serpbear.com/) | [Changelog](https://github.com/towfiqi/serpbear/blob/main/CHANGELOG.md) | [Docker Image](https://hub.docker.com/r/towfiqi/serpbear)

SerpBear is an Open Source Search Engine Position Tracking App. It allows you to track your website's keyword positions in Google and get notified of their positions.

![Easy to Use Search Engine Rank Tracker](https://erevanto.sirv.com/Images/serpbear/serpbear_readme_v2.gif)

#### Features
-   **Unlimited Keywords:** Add unlimited domains and unlimited keywords to track their SERP.
-   **Email Notification:** Get notified of your keyword position changes daily/weekly/monthly through email.
-   **SERP API:** SerpBear comes with built-in API that you can use for your marketing & data reporting tools.
-   **Google Search Console Integration:** Get the actual visit count, impressions & more for Each keyword. 
-   **Mobile App:** Add the PWA app to your mobile for a better mobile experience. 
-   **Zero Cost to RUN:** Run the App on mogenius.com or Fly.io for free.

#### How it Works
The App uses third party website scrapers like ScrapingAnt, ScrapingRobot, SerpApi or Your given Proxy ips to scrape google search results to see if your domain appears in the search result for the given keyword. Also, When you connect your Googel Search Console account, the app shows actual search visits for each tracked keywords. You can also discover new keywords, and find the most performing keywords, countries, pages.

#### Getting Started
-   **Step 1:** Deploy & Run the App.
-   **Step 2:** Access your App and Login.
-   **Step 3:** Add your First domain.
-   **Step 4:** Get an free API key from either ScrapingAnt or ScrapingRobot. Skip if you want to use Proxy ips.
-   **Step 5:** Setup the Scraping API/Proxy from the App's Settings interface.
-   **Step 6:** Add your keywords and start tracking.
-   **Step 7:** Optional. From the Settings panel, setup SMTP details to get notified of your keywords positions through email. You can use ElasticEmail and Sendpulse SMTP services that are free.  

#### Compare SerpBear with other SERP tracking services

|Service  | Cost | SERP Lookup | API |
|--|--|--|--|
| SerpBear | Free* | Unlimited* | Yes |
| ranktracker.com | $18/mo| 3,000/mo| No |
| SerpWatch.io | $29/mo | 7500/mo | Yes |
| Serpwatcher.com | $49/mo| 3000/mo | No |
| whatsmyserp.com | $49/mo| 30,000/mo| No |
| serply.io | $49/mo | 5000/mo | Yes |
| serpapi.com | From $50/mo** | From 5,000/mo** | Yes |

(*) Free upto a limit. If you are using ScrapingAnt you can lookup 10,000 times per month for free.
(**) Free up to 100 per month. Paid from 5,000 to 10,000,000+ per month.

**Stack**
-   Next.js for Frontend & Backend.  
-   Sqlite for Database.
