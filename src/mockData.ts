export default {
  "count": 1,
  "medium": 0,
  "high": 1,
  "overallRisk": 100,
  "issues": [
    {
      "score": 23.1,
      "tags": [
        {
          "name": "Unverified",
          "description": "Unverified contracts on block explorers do not present their code in human-readable form, potentially concealing hidden mechanisms or malicious functions.",
          "type": "tokenRisk",
          "severity": 2,
          "key": "is_closed_source"
        },
        {
          "name": "Sanctioned",
          "description": "This is a Sanctioned Activity that has been found and reported by world authorities.",
          "type": "addressRisk",
          "severity": 10,
          "key": "sanctioned"
        },
        {
          "name": "Interacted with Sanctioned",
          "description": "This address has interacted with an address associated with sanctioned activity.",
          "type": "addressRisk",
          "severity": 0.1,
          "key": "associated_sanctioned"
        },
        {
          "name": "Possible Blacklist",
          "description": "This address has been reported numerous times as dangerous. Proceed with caution.",
          "type": "addressRisk",
          "severity": 3,
          "key": "blacklist_doubt"
        },
        {
          "name": "Theft",
          "description": "This address has been involved in theft. Do not send anything to this address.",
          "type": "addressRisk",
          "severity": 10,
          "key": "stealing_attack"
        }
      ],
      "categories": {
        "governance_issues": {
          "key": "governance_issues",
          "name": "Contract Governance",
          "description": "Suspect logic in the smart contract for this asset indicates elevated governance risk.",
          "tags": {
            "is_closed_source": true
          }
        },
        "fraudulent_malicious": {
          "key": "fraudulent_malicious",
          "name": "Fraudulent/Malicious",
          "gradedDescription": {
            "high": "The smart contract/address in this transaction has been used in and is associated with confirmed fraud and malicious activity.",
            "medium": "Elements of the smart contract in this transaction can be used a fraudulent and malicious fashion.",
            "low": "Properties of this transaction indicate the possibility of nefarious activity."
          },
          "tags": {
            "sanctioned": true,
            "blacklist_doubt": true,
            "stealing_attack": true
          }
        }
      },
      "riskScore": "High Risk"
    }
  ],
  "details": {
    "fund_flows": {
      "risk": {
        "ofac": true,
        "hacker": false,
        "mixers": false,
        "drainer": false
      },
      "flows": [
        {
          "to": "0x209c4784AB1E8183Cf58cA33cb740efbF3FC18EF",
          "from": "0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C",
          "type": "transfer",
          "token": "@native",
          "amount": 1,
          "txhash": "0x8daa1a5ee0b3b4da49cbafcf419e62997b090830d4744a1d1e9eeab821bb7188",
          "risk_score": 20
        },
        {
          "to": "0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C",
          "from": "0x64d7C712529Ae520F2f4320A13448bDbf5Ae1830",
          "type": "transfer",
          "token": "@native",
          "amount": 1,
          "txhash": "0x8daa1a5ee0b3b4da49cbafcf419e62997b090830d4744a1d1e9eeab821bb7188",
          "risk_score": 20
        },
        {
          "to": "0x209c4784AB1E8183Cf58cA33cb740efbF3FC18EF",
          "from": "0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C",
          "type": "transfer",
          "token": "@native",
          "amount": 33,
          "txhash": "0x3e51ad996fc5910f04e69af0bf9d17e122694c33eab731f3c04319c65ccc86cf",
          "risk_score": 20
        }
      ],
      "label": "Anton Nikolaeyvich Andreyev (OFAC Sanctioned)",
      "accounts": {
        "0x209c4784AB1E8183Cf58cA33cb740efbF3FC18EF": {
          "type": "contract",
          "label": "Poloniex",
          "address": "0x209c4784AB1E8183Cf58cA33cb740efbF3FC18EF",
          "risk_score": 0
        },
        "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa": {
          "type": "eoa",
          "label": "Bitfinex",
          "address": "0x876EabF441B2EE5B5b0554Fd502a8E0600950cFa",
          "risk_score": 0
        }
      }
    },
    "address_info": {
      "balance": 0,
      "transaction_count": 101,
      "has_no_transactions": false
    }
  }
};