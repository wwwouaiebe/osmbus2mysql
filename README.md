# osmbus2mysql

## Wiki

### Loading the bus table from Wiki

Open the wiki and import the existing table from the wiki to the oldWiki.txt file (copy and paste) and then run;

node ./src/index.js --loadOldWiki=true --dbName=osmbus

### Creting a new bus table for the Wiki

Open the wiki and import the existing table from the wiki to the oldWiki.txt file (copy and paste) and then run:

node ./src/index.js --createNewWiki=true --dbName=osmbus

Copy the content of the newWiki.txt table to the wiki

## Bus stops

### Loading data from OSM

#### Loading bus route and route_master relations

node ./src/index.js --loadOsmBus=true --dbName=osmbus

#### Loading bus_stop

Loading the entire province (all networks):
node ./src/index.js --loadOsmBusStop=true --loadOsmBusStopAllNetworks=true --dbName=osmbus

Loading only bus_stop with a network=TECL tag:
node ./src/index.js --loadOsmBusStop=true --dbName=osmbus

### All bus_stop without OSM ref:TECL

Use node ./src/index.js --loadOsmBusStop=true --loadOsmBusStopAllNetworks=true --dbName=osmbus for upload of nodes

/* All bus_stop without OSM ref:TECL */
SELECT 
    osm_id, osm_name, osm_network,osm_ref_TECL, osm_ref_TECN, osm_ref_TECB, osm_ref_TECX, osm_ref_De_Lijn 
	FROM osmbus.osm_bus_stops 
	WHERE osm_ref_TECL IS NULL and osm_ref_TECN IS NULL and osm_ref_TECB IS NULL and osm_ref_TECX IS NULL
    and osm_network LIKE '%TECL%' 
	ORDER BY osm_name;

Todo: Add a OSM ref:TECL when possible

### All bus_stop with an OSM ref:TECL tag not found in the GTFS stops table

/* All bus_stop with an OSM ref:TECL tag not found in the GTFS stops table */
SELECT 
	osm_id, osm_name,osm_name_TEC, osm_ref_TECL
    FROM osmbus.osm_bus_stops 
 	WHERE 
    osm_ref_TECL COLLATE utf8mb4_0900_as_cs NOT IN 
    (SELECT gtfs_tec.stops.stop_id COLLATE utf8mb4_0900_as_cs AS osm_ref_TECL FROM gtfs_tec.stops)
    order by osm_name;

Todo: Remove the OSM ref:TECL tag ( better to have no data than wrong data but be sure that the bus is not in the GTFS table due to holidays, road works...)

### All bus_stop using a duplicate OSM ref_TECL

/* All bus_stop using a duplicate OSM ref_TECL */
SELECT osm_id, osm_name, osm_ref_TECL 
	FROM osmbus.osm_bus_stops 
	WHERE osm_ref_TECL IN 
		( SELECT osm_ref_TECL FROM osmbus.osm_bus_stops  GROUP BY (osm_ref_TECL COLLATE utf8mb4_0900_as_cs) HAVING COUNT( osm_ref_TECL ) > 1)
	ORDER BY osm_ref_tecl;

Todo: Correct the OSM ref_TECL tag when possible

### All bus_stop where OSM name <> GTFS stop_name or OSM name <> OSM name:TEC

/* All bus_stop where OSM name <> GTFS stop_name or OSM name <> OSM name:TEC */
SELECT 
	osm_id, osm_name,osm_name_TEC, osm_ref_TECL, stop_name 
    FROM osmbus.osm_bus_stops 
    JOIN gtfs_tec.stops 
    ON ( osmbus.osm_bus_stops.osm_ref_TECL COLLATE utf8mb4_0900_as_cs ) = (gtfs_tec.stops.stop_id COLLATE utf8mb4_0900_as_cs)
	WHERE 
    	IFNULL (
            ( osmbus.osm_bus_stops.osm_name_TEC COLLATE utf8mb4_0900_ai_ci ),
            ( osmbus.osm_bus_stops.osm_name COLLATE utf8mb4_0900_ai_ci )
        )    
        <> 
        REPLACE ( gtfs_tec.stops.stop_name COLLATE utf8mb4_0900_ai_ci, "´","'")
	ORDER BY gtfs_tec.stops.stop_name;

Todo: Correct the OSM name or add a name:TEC when the correction of the OSM name is not possible

### All bus_stop where OSM name:TEC <> OSM GTFS stop_name

/* All bus_stop where OSM name:TEC <> OSM GTFS stop_name */
SELECT 
	osm_id, osm_name,osm_name_TEC, osm_ref_TECL, stop_name 
    FROM osmbus.osm_bus_stops 
    JOIN gtfs_tec.stops 
    ON ( osmbus.osm_bus_stops.osm_ref_TECL COLLATE utf8mb4_0900_as_cs ) = (gtfs_tec.stops.stop_id COLLATE utf8mb4_0900_as_cs)
	WHERE 
    	osmbus.osm_bus_stops.osm_name_TEC IS NOT NULL
        AND
        osmbus.osm_bus_stops.osm_name_TEC COLLATE utf8mb4_0900_ai_ci
		<> 
        REPLACE ( gtfs_tec.stops.stop_name COLLATE utf8mb4_0900_ai_ci , "´","'")
	ORDER BY gtfs_tec.stops.stop_name;

Todo: Align the OSM name:TEC on the GTFS stop_name

### All bus_stop where OSM name:TEC = OSM name

/* All bus_stop where OSM name:TEC = OSM name */
SELECT 
	osm_id, osm_name,osm_name_TEC, osm_ref_TECL, stop_name 
    FROM osmbus.osm_bus_stops 
    JOIN gtfs_tec.stops 
    ON ( osmbus.osm_bus_stops.osm_ref_TECL COLLATE utf8mb4_0900_as_cs ) = (gtfs_tec.stops.stop_id COLLATE utf8mb4_0900_as_cs)
	WHERE 
    	osmbus.osm_bus_stops.osm_name_TEC IS NOT NULL
        AND
        osmbus.osm_bus_stops.osm_name_TEC COLLATE utf8mb4_0900_ai_ci
		=
        osmbus.osm_bus_stops.osm_name COLLATE utf8mb4_0900_ai_ci
        AND
        osmbus.osm_bus_stops.osm_name not like '%ß%'
	ORDER BY gtfs_tec.stops.stop_name;