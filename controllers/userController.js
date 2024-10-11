const fs = require('fs');
const path = require('path');
const axios = require('axios');

const { StatusCodes } = require('http-status-codes');

const logger = require('../helper/logger');

const BET_WEBSITE_URL = 'https://sge.swisslos.ch/papi';

const getAllData = async (req, res) => {
	const { limit } = req.params; // Limit in hours
	const limitTime = Date.now() + limit * 60 * 60 * 1000; // Convert hours to milliseconds
	let nextParams = null;
	console.log("scrape start!");

	let result = [];

	do {
		let variables = {
			sportId: 0,
			eventSize: 20,
			marketTypes: [5, 6]
		};
		if (nextParams != null) {
			variables.nextParams = nextParams;
		}
		try {
			const response = await axios.post(BET_WEBSITE_URL, {
				operationName: "CurrentPrematchEvents",
				variables,
				query: `query CurrentPrematchEvents($marketTypes: [Int!], $eventSize: Int!, $nextParams: JSONObject = null, $sportId: Int = 0) {
						currentPrematchEvents(
								eventSize: $eventSize
								marketTypes: $marketTypes
								sportId: $sportId
								nextParams: $nextParams
						) {
								...CurrentEvents
								__typename
						}
				}
				fragment CurrentEvents on PageableMarketResponse {
						nextParams
						totalHits
						events {
								...EventVO
								sport {
										id
										__typename
								}
								...CompetitionDataVO
								__typename
						}
						markets {
								...MarketVO
								__typename
						}
						__typename
				}
				fragment EventVO on EventData {
						id
						names {
								...Names
								__typename
						}
						scheduledDate
						outright
						participants {
								...ParticipantVO
								__typename
						}
						betradarId
						__typename
				}
				fragment Names on Names {
						de
						fr
						it
						en
						__typename
				}
				fragment ParticipantVO on Participant {
						id
						names {
								...Names
								__typename
						}
						__typename
				}
				fragment CompetitionDataVO on EventData {
						competitionGroup {
								id
								names {
										...Names
										__typename
								}
								__typename
						}
						competition {
								id
								names {
										...Names
										__typename
								}
								__typename
						}
						__typename
				}
				fragment MarketVO on Market {
						id
						marketNo
						marketType
						marketTypePriority
						eventId
						sellBeginDate
						sellEndDate
						status
						version
						specialOddsValue
						names {
								...Names
								__typename
						}
						outcomeOdds {
								outcomeNumber
								odds
								result
								version
								names {
										...Names
										__typename
								}
								__typename
						}
						__typename
				}`
			}, {
				headers: {
					"Accept": "application/json, text/plain, */*",
					"Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
					"Content-Type": "application/json",
					"Sec-CH-UA": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
					"Sec-CH-UA-Mobile": "?0",
					"Sec-CH-UA-Platform": "\"Windows\"",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "cross-site",
					"Referer": "https://www.pmu.ch/",
					"Referrer-Policy": "strict-origin-when-cross-origin"
				}
			});

			const data = response.data.data.currentPrematchEvents;

			const events = data.events;
			const markets = data.markets;
			const combined = events.map(event => {
				const market = markets.find(market => market.eventId === event.id) || null; // Get the first matching market
				return {
					...event,
					market // Attach the market (or null if not found)
				};
			});
			result.push(...combined);
			console.log("result=", result.length, ", ", combined.length)

			// Update nextParams based on the response
			if (data.nextParams) {
				nextParams = data.nextParams;
			} else {
				break; // Exit if no nextParams
			}

		} catch (error) {
			console.error('Error fetching data:', error.message);
			break; // Exit on error
		}
		console.log("next=", nextParams.scheduledDate, ", ", limitTime, ", ", result.length);
	} while (nextParams.scheduledDate < limitTime);

	res.status(StatusCodes.OK).json({ result });
}

const getDataByEventId = async (req, res) => {
	const { eventid } = req.params; // Limit in hours
	const data = {
		operationName: "SportsEventByEventId",
		variables: {
			eventId: eventid,
			marketTypes: [
				379, 889, 686, 694, 702, 678, 504, 357, 369, 367,
				364, 362, 24, 178, 181, 180, 176, 189, 820, 185,
				70, 465, 891, 892, 458, 455, 454, 452, 384, 383,
				382, 381, 380, 378, 377, 376, 375, 374, 437, 890,
				911, 817, 432, 174, 39, 69, 182, 183, 184, 324,
				179, 501, 63, 20, 8, 7, 6, 887, 453, 459, 460,
				461, 464, 345, 344
			],
			marketSize: 1000
		},
		query: `query SportsEventByEventId($eventId: Long!, $marketTypes: [Int!]!, $marketSize: Int!) {
    sportsEventByEventId(
      eventId: $eventId
      marketTypes: $marketTypes
      marketSize: $marketSize
    ) {
      ...EventWithMarketGroupsVO
      __typename
    }
  }

  fragment EventWithMarketGroupsVO on MarketResponse {
    events {
      ...EventVO
      __typename
    }
    ...EventMarketsByMarketTypeVO
    __typename
  }

  fragment EventVO on EventData {
    id
    names {
      ...Names
      __typename
    }
    scheduledDate
    outright
    participants {
      ...ParticipantVO
      __typename
    }
    betradarId
    __typename
  }

  fragment Names on Names {
    de
    fr
    it
    en
    __typename
  }

  fragment ParticipantVO on Participant {
    id
    names {
      ...Names
      __typename
    }
    __typename
  }

  fragment EventMarketsByMarketTypeVO on MarketResponse {
    markets {
      ...MarketVO
      __typename
    }
    ...MarketTypeGroupVO
    __typename
  }

  fragment MarketVO on Market {
    id
    marketNo
    marketType
    marketTypePriority
    eventId
    sellBeginDate
    sellEndDate
    status
    version
    specialOddsValue
    names {
      ...Names
      __typename
    }
    outcomeOdds {
      outcomeNumber
      odds
      result
      version
      names {
        ...Names
        __typename
      }
      __typename
    }
    __typename
  }

  fragment MarketTypeGroupVO on MarketResponse {
    markets {
      marketType
      marketTypePriority
      __typename
    }
    events {
      sport {
        id
        __typename
      }
      __typename
    }
    __typename
  }`
	};

	const config = {
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
			'Content-Type': 'application/json',
			'Sec-CH-UA': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
			'Sec-CH-UA-Mobile': '?0',
			'Sec-CH-UA-Platform': '"Windows"',
			'Sec-Fetch-Dest': 'empty',
			'Sec-Fetch-Mode': 'cors',
			'Sec-Fetch-Site': 'cross-site',
			'Referer': 'https://www.pmu.ch/',
			'Referrer-Policy': 'strict-origin-when-cross-origin'
		}
	};

	axios.post(BET_WEBSITE_URL, data, config)
		.then(response => {
			console.log(response.data);
			return res.status(StatusCodes.OK).json(response.data);
		})
		.catch(error => {
			console.error('Error:', error);
			return res.status(StatusCodes.OK).json({ error });
		});
}
module.exports = {
	getAllData,
	getDataByEventId,
};
