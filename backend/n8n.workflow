

{
  "nodes": [
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/texts",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "limit",
              "value": "10"
            },
            {
              "name": "offset",
              "value": "1"
            },
            {
              "name": "language",
              "value": "bo"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        768,
        -256
      ],
      "id": "5692e876-5540-494c-bf2e-e8d36a5e6b21",
      "name": "Get all texts from openpechaAPI"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/instances/{{ $json.metadata.id }}/related ",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        544,
        -432
      ],
      "id": "24101215-0c63-471f-ba7f-5d459a5b120e",
      "name": "get related instances openPechaAPI"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/instances/{{ $json.active_segment.instance_id }}/segment-content",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n\"segment_ids\":[{{$json.active_segment.segments_ids}}]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        768,
        -432
      ],
      "id": "a1334f2b-77f6-45ab-a936-0200c4066019",
      "name": "get segment contents OpenpechaAPI"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/instances/{{ $json.id }}/segment-related ",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "span_start",
              "value": "={{ $('Webhook1').item.json.body.span_start }}"
            },
            {
              "name": "span_end",
              "value": "={{ $('Webhook1').item.json.body.span_end }}"
            },
            {
              "name": "transform",
              "value": "false"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        768,
        0
      ],
      "id": "43015bc5-9f40-41e5-b141-787225d26d9a",
      "name": "get all related segments1"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/texts/{{ $('Webhook1').item.json.body.text_id }}/instances ",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "instance_type",
              "value": "critical"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        544,
        -208
      ],
      "id": "f4d06c21-26c8-456e-b4a1-4501c2b1732f",
      "name": "get instance list OpenpechaAPI2"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/texts/{{ $json.body.text_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        544,
        0
      ],
      "id": "19a775bd-5161-45e0-99cf-5add8ba65f52",
      "name": "Get Single Text from OpenPechaAPI2"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/instances/{{ $json.instance_id }}/segment-content",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n\"segment_ids\":[{{ $json.segments_ids }}]\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        544,
        192
      ],
      "id": "0d5bcd30-877d-42ed-a92f-7e85652b0374",
      "name": "get segment contents OpenpechaAPI2"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/instances/{{ $json.id }}",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "annotation",
              "value": "true"
            },
            {
              "name": "content",
              "value": "true"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        784,
        208
      ],
      "id": "74c83f7d-d47f-4f39-ba39-b3e774286a67",
      "name": "get individual instance detail1"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/texts/{{ $('Webhook').item.json.body.text_id }}/instances ",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "instance_type",
              "value": "critical"
            }
          ]
        },
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        544,
        400
      ],
      "id": "05edf11a-264a-4ebc-9d0c-9f8ad055c723",
      "name": "get instance list OpenpechaAPI3"
    },
    {
      "parameters": {
        "url": "=https://api-l25bgmwqoa-uc.a.run.app/v2/texts/{{ $json.body.text_id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "accept",
              "value": "application/json"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        784,
        400
      ],
      "id": "216bf1c6-b2b1-4829-93ca-0fdfa4fca8d7",
      "name": "Get Single Text from OpenPechaAPI3"
    }
  ],
  "connections": {
    "Get all texts from openpechaAPI": {
      "main": [
        []
      ]
    },
    "get related instances openPechaAPI": {
      "main": [
        []
      ]
    },
    "get segment contents OpenpechaAPI": {
      "main": [
        []
      ]
    }
  },
  "pinData": {
    "get all related segments1": [
      {
        "segments": [
          {
            "segment_id": "fHdXUIGSCZtzf7aZk07rE",
            "span": {
              "start": 0,
              "end": 26
            }
          },
          {
            "segment_id": "9hzzvc9RlsoTE1awshzVy",
            "span": {
              "start": 26,
              "end": 62
            }
          },
          {
            "segment_id": "aHTW5SQChJ8ablrDToAx5",
            "span": {
              "start": 62,
              "end": 102
            }
          },
          {
            "segment_id": "5KyoHldAawlyogZLTvSnI",
            "span": {
              "start": 102,
              "end": 151
            }
          },
          {
            "segment_id": "c168d4V0ezFhUA6DLGvjm",
            "span": {
              "start": 151,
              "end": 421
            }
          },
          {
            "segment_id": "ISp3BiYuEIHVWMeuxerqH",
            "span": {
              "start": 421,
              "end": 646
            }
          },
          {
            "segment_id": "xN46e3RXCPEwcQTA5SNLD",
            "span": {
              "start": 646,
              "end": 851
            }
          },
          {
            "segment_id": "6WGlKQwMpuMwboGR43My1",
            "span": {
              "start": 851,
              "end": 1150
            }
          },
          {
            "segment_id": "EezdKp8NHWaBbxWwj1Czr",
            "span": {
              "start": 1150,
              "end": 1328
            }
          },
          {
            "segment_id": "twVEf8Ex6xIUiyR6fNkLh",
            "span": {
              "start": 1328,
              "end": 1546
            }
          }
        ],
        "instance_metadata": {
          "colophon": null,
          "alt_incipit_titles": [],
          "wiki": null,
          "source": "bdrc",
          "id": "tIfB1lgd0p1SeXXYVMQBL",
          "incipit_title": [],
          "type": "critical",
          "bdrc": null
        },
        "text_metadata": {
          "date": null,
          "copyright": null,
          "wiki": null,
          "language": "en",
          "alt_titles": [],
          "title": [
            {
              "language": "en",
              "text": "The Way of the Bodhisattva"
            }
          ],
          "type": "translation",
          "target": "FedFIyi0p4SuJDiJdg80S",
          "license": "CC0",
          "category_id": "ueGGpjqWZ8hMYTik6ftUB",
          "id": "jfcqYvoBCFPzUySdH41cc",
          "contributors": [
            {
              "person_bdrc_id": "P1243",
              "role": "translator",
              "person_id": "MdJYTpw6Nv8nIPmtlefUf"
            }
          ],
          "bdrc": null
        },
        "relation": "translation"
      },
      {
        "segments": [
          {
            "segment_id": "hv8SC0v8RKw8e3yDcWoFP",
            "span": {
              "start": 0,
              "end": 4
            }
          },
          {
            "segment_id": "OaC6gx0BUtfSzlAlKNWA0",
            "span": {
              "start": 4,
              "end": 18
            }
          },
          {
            "segment_id": "SH4tbhAQ6OkaeWfCGHA3E",
            "span": {
              "start": 18,
              "end": 25
            }
          },
          {
            "segment_id": "hFrGgS1AHRkLRsliBB1ia",
            "span": {
              "start": 25,
              "end": 36
            }
          },
          {
            "segment_id": "d80oyYNof4Z91zyKJ9DD4",
            "span": {
              "start": 36,
              "end": 89
            }
          },
          {
            "segment_id": "cO0esO2Ch9zROUta4LlbF",
            "span": {
              "start": 89,
              "end": 158
            }
          },
          {
            "segment_id": "RJko17RMsaOJOIFnT1Tju",
            "span": {
              "start": 158,
              "end": 215
            }
          },
          {
            "segment_id": "LDOm5Cp5I652W93gh3PbT",
            "span": {
              "start": 215,
              "end": 275
            }
          },
          {
            "segment_id": "4VNsgcErQOeBCmpycdhBX",
            "span": {
              "start": 275,
              "end": 335
            }
          },
          {
            "segment_id": "ZS9MPWd0gXTxKADoFfJy9",
            "span": {
              "start": 335,
              "end": 388
            }
          }
        ],
        "instance_metadata": {
          "colophon": null,
          "alt_incipit_titles": [],
          "wiki": null,
          "source": "bdrc",
          "id": "876j36YwKFetA2GAtiNIv",
          "incipit_title": [],
          "type": "critical",
          "bdrc": null
        },
        "text_metadata": {
          "date": null,
          "copyright": null,
          "wiki": null,
          "language": "zh",
          "alt_titles": [],
          "title": [
            {
              "language": "zh",
              "text": "菩萨行论"
            }
          ],
          "type": "translation",
          "target": "FedFIyi0p4SuJDiJdg80S",
          "license": "CC0",
          "category_id": "ueGGpjqWZ8hMYTik6ftUB",
          "id": "LQiSruzx5XEGLiLyV3C6Y",
          "contributors": [
            {
              "person_bdrc_id": "P1243",
              "role": "translator",
              "person_id": "MdJYTpw6Nv8nIPmtlefUf"
            }
          ],
          "bdrc": null
        },
        "relation": "translation"
      },
      {
        "segments": [
          {
            "segment_id": "KPn4um67XaQLYUqJyjW6x",
            "span": {
              "start": 21655,
              "end": 23395
            }
          },
          {
            "segment_id": "gBTNsZqDt7OMopkWzajkV",
            "span": {
              "start": 23395,
              "end": 26462
            }
          },
          {
            "segment_id": "QGGV7BjvBqQdBlhm7N4qU",
            "span": {
              "start": 26462,
              "end": 28152
            }
          },
          {
            "segment_id": "hUv6uvVNvOsHGpg1Yh4F5",
            "span": {
              "start": 28152,
              "end": 29624
            }
          },
          {
            "segment_id": "5dMnirANIoJAce9fjSkk9",
            "span": {
              "start": 29624,
              "end": 32223
            }
          },
          {
            "segment_id": "DsvvpV2yJqn9TDwvh9lsg",
            "span": {
              "start": 32223,
              "end": 34430
            }
          },
          {
            "segment_id": "tJUGhKL5UvI2kQnM0E7Ov",
            "span": {
              "start": 34430,
              "end": 36294
            }
          },
          {
            "segment_id": "Bse9NF3KRg1TKoqffaWir",
            "span": {
              "start": 36294,
              "end": 36741
            }
          },
          {
            "segment_id": "DXBfOycaLZDFaOuyl7d6g",
            "span": {
              "start": 36741,
              "end": 37436
            }
          }
        ],
        "instance_metadata": {
          "colophon": null,
          "alt_incipit_titles": [],
          "wiki": null,
          "source": "bdrc",
          "id": "opkY4lEcCrkjjeu1I1X5t",
          "incipit_title": [],
          "type": "critical",
          "bdrc": null
        },
        "text_metadata": {
          "date": null,
          "copyright": null,
          "wiki": null,
          "language": "bo",
          "alt_titles": [],
          "title": [
            {
              "language": "bo",
              "text": "བྱང་ཆུབ་སེམས་དཔའི་སྤྱོད་པ་ལ་འཇུག་པའི་ཚིག་འགྲེལ་འཇམ་དབྱངས་བླ་མའི་ཞལ་ལུང་"
            }
          ],
          "type": "commentary",
          "target": "FedFIyi0p4SuJDiJdg80S",
          "license": "CC0",
          "category_id": "ueGGpjqWZ8hMYTik6ftUB",
          "id": "T0ldDKBeVtooJHOAsSlfU",
          "contributors": [
            {
              "person_bdrc_id": "P3816",
              "role": "author",
              "person_id": "I3T7kd6OkmzCCPeAcoKDr"
            }
          ],
          "bdrc": null
        },
        "relation": "commentary"
      },
      {
        "segments": [
          {
            "segment_id": "FF2zF8xHR5LrqDOR5cRK7",
            "span": {
              "start": 2632,
              "end": 3442
            }
          },
          {
            "segment_id": "ErXtZDboazW17KjdTHTcP",
            "span": {
              "start": 3442,
              "end": 4908
            }
          },
          {
            "segment_id": "rnAqU1nUjbesBJkBAbt41",
            "span": {
              "start": 4908,
              "end": 6020
            }
          },
          {
            "segment_id": "BRcOVvishLNuXKigd99E2",
            "span": {
              "start": 6020,
              "end": 6451
            }
          },
          {
            "segment_id": "HZRbcRr4j4PVUeVs9zj35",
            "span": {
              "start": 6451,
              "end": 7285
            }
          },
          {
            "segment_id": "TUM2ybiZRZa9KNPF5Swhc",
            "span": {
              "start": 7285,
              "end": 7879
            }
          },
          {
            "segment_id": "dBKOf2eo1OlFE49bdrWWF",
            "span": {
              "start": 7879,
              "end": 11333
            }
          },
          {
            "segment_id": "y5AdDJBHbo072nHKYjsnD",
            "span": {
              "start": 11333,
              "end": 12500
            }
          },
          {
            "segment_id": "pGOdQ4MuZQywt33MVxGAb",
            "span": {
              "start": 12500,
              "end": 12932
            }
          },
          {
            "segment_id": "QcktOHY8kxm34qrP7brQe",
            "span": {
              "start": 12932,
              "end": 13418
            }
          },
          {
            "segment_id": "v06avSocX7Ov09eex6DNs",
            "span": {
              "start": 13418,
              "end": 13831
            }
          }
        ],
        "instance_metadata": {
          "colophon": null,
          "alt_incipit_titles": [],
          "wiki": null,
          "source": "bdrc",
          "id": "oZ0F2d3idq4aM5AJWaxNf",
          "incipit_title": [],
          "type": "critical",
          "bdrc": null
        },
        "text_metadata": {
          "date": null,
          "copyright": null,
          "wiki": null,
          "language": "bo",
          "alt_titles": [],
          "title": [
            {
              "language": "bo",
              "text": "བྱང་ཆུབ་སེམས་དཔའི་སྤྱོད་པ་ལ་འཇུག་པའི་རྣམ་བཤད་རྒྱལ་སྲས་འཇུག་ངོགས་བཞུགས་སོ།"
            }
          ],
          "type": "commentary",
          "target": "FedFIyi0p4SuJDiJdg80S",
          "license": "CC0",
          "category_id": "ueGGpjqWZ8hMYTik6ftUB",
          "id": "DQ2sDqd7HeU4e3iT7NTeA",
          "contributors": [
            {
              "person_bdrc_id": "P4699",
              "role": "author",
              "person_id": "9jEHizSJlBBFl6Ae6Bulb"
            }
          ],
          "bdrc": null
        },
        "relation": "commentary"
      }
    ],
    "get instance list OpenpechaAPI2": [
      {
        "id": "P5PrXLTbW02wFeAh2U7w7",
        "bdrc": null,
        "wiki": null,
        "type": "critical",
        "source": "bdrc",
        "colophon": null,
        "incipit_title": null,
        "alt_incipit_titles": [],
        "biblography_annotation": null
      }
    ],
    "Get Single Text from OpenPechaAPI2": [
      {
        "bdrc": "WA0RT3216",
        "wiki": null,
        "type": "translation_source",
        "contributions": [
          {
            "person_id": "FUeF3VrJOix1at29AL8Gw",
            "person_bdrc_id": "P6161",
            "role": "author"
          },
          {
            "person_id": "8M3R5xSmyUFdMETyGVgkA",
            "person_bdrc_id": "P8182",
            "role": "translator"
          },
          {
            "person_id": "zpdgj0AWZ4HGjay7CU8cw",
            "person_bdrc_id": "P753",
            "role": "translator"
          },
          {
            "person_id": "JdmVZuFxmTsb2TmNqUA2A",
            "person_bdrc_id": "P8216",
            "role": "translator"
          }
        ],
        "date": "2025-11-18",
        "title": {
          "bo": "བྱང་ཆུབ་སེམས་དཔའི་སྤྱོད་པ་ལ་འཇུག་པ།"
        },
        "alt_titles": [],
        "language": "bo",
        "target": null,
        "category_id": "ueGGpjqWZ8hMYTik6ftUB",
        "copyright": "Public domain",
        "license": "CC0",
        "id": "FedFIyi0p4SuJDiJdg80S"
      }
    ]
  },
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "6a4c2dc5f26b3ee7d2d1184f3ea8b974c1111746ea6f4222d57591f9999d6cb1"
  }
}