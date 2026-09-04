# DLD attribute dictionaries

All **25** Excel dictionaries were read in full and normalized into `reports/dld/phase0/attribute_dictionary.csv`.

| Dataset | Dictionary fields | CSV columns | Dictionary-only | CSV-only | Declared key |
| --- | ---: | ---: | --- | --- | --- |
| Accredited Trainers by the Dubai Real Estate Institute | 10 | 11 | — | load_timestamp | course_time_from, course_time_to, age_group, trainee_gender, no_of_trainees, course_code, cource_title_ar, cource_title_en, course_date, course_to |
| Approved Escrow Account Agents | 4 | 5 | — | load_timestamp | escrow_agent_number |
| Building and Property Project Records | 45 | 46 | — | load_timestamp | none declared |
| Developers Recorded in Dubai Land Department | 22 | 23 | — | load_timestamp | developer_id |
| Elders and People of Determination | 13 | 14 | — | load_timestamp | service_year, service_month |
| Free Zone Companies Licensing | 12 | 13 | — | load_timestamp | fz_company_number |
| Land Registry | 31 | 32 | — | load_timestamp | property_id |
| Licenced Owner Associations | 6 | 7 | — | load_timestamp | company_name_ar, company_name_en, phone, email, latitude, longitude |
| Licensed Real Estate Valuators | 14 | 15 | — | load_timestamp | valuator_number, valuation_company_number |
| Lookup Dubai Community Areas | 4 | 5 | — | load_timestamp | area_id |
| Lookup Real Estate Market Types | 3 | 4 | — | load_timestamp | market_type_id |
| Lookup Real Estate Transactions Groups | 3 | 4 | — | load_timestamp | group_id |
| Lookup Real Estate Transactions Procedures | 5 | 6 | — | load_timestamp | group_id |
| Owners Association Service Charges | 19 | 20 | — | load_timestamp | master_community_id, property_group_id, project_id, usage_id, budget_year, service_category_id |
| Property Map Requests | 15 | 16 | — | load_timestamp | request_id |
| Property Valuation Records | 20 | 21 | — | load_timestamp | none declared |
| Real Estate Brokers | 13 | 14 | — | load_timestamp | real_estate_broker_id |
| Real Estate Licenses | 23 | 24 | — | load_timestamp | activity_type_id, participant_id |
| Real Estate Offices | 18 | 19 | — | load_timestamp | real_estate_id |
| Real Estate Permits | 20 | 21 | — | load_timestamp | permits_id |
| Real Estate Projects | 37 | 38 | — | load_timestamp | project_id |
| Real Estate Transactions | 46 | 47 | — | load_timestamp | transaction_id |
| Registered Freehold Real Estate Units | 46 | 47 | — | load_timestamp | none declared |
| Rent Contracts | 40 | 41 | — | load_timestamp | line_number, contract_id |
| Residential Sale Index | 19 | 20 | — | load_timestamp | first_date_of_month |

`load_timestamp` is expected to be CSV-only because it is ingestion lineage rather than a DLD business attribute.
