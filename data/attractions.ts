export interface Attraction {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    customColor?: string; // Nowe pole dla niestandardowego koloru
}

export const viennaAttractions: Attraction[] = [
    {
        id: 1,
        name: "Pomnik feldmarszałka Schwarzenberga",
        address: "Schwarzenbergplatz, 1010 Wien",
        latitude: 48.198579,
        longitude: 16.377638
    },
    {
        id: 2,
        name: "Pałac Habsburgów (Hofburg)",
        address: "Michaelerplatz 1, 1010 Wien",
        latitude: 48.206466,
        longitude: 16.365477
    },
    {
        id: 3,
        name: "Belvedere Palace",
        address: "Prinz-Eugen-Straße 27, 1030 Wien",
        latitude: 48.191433,
        longitude: 16.380888
    },
    {
        id: 4,
        name: "Muzeum Armii Austriackiej (Heeresgeschichtliches Museum)",
        address: "Arsenalstraße 1, 1030 Wien",
        latitude: 48.185435,
        longitude: 16.394493
    },
    {
        id: 5,
        name: "Miejsce Bitwy pod Wiedniem (Kahlenberg)",
        address: "Am Kahlenberg, 1190 Wien",
        latitude: 48.270898,
        longitude: 16.345320
    },
    {
        id: 6,
        name: "Türkenschanzpark",
        address: "Türkenschanzpark, 1180 Wien",
        latitude: 48.232324,
        longitude: 16.316593
    },
    {
        id: 7,
        name: "Kolumna Trójcy Świętej",
        address: "Graben, 1010 Wien",
        latitude: 48.209067,
        longitude: 16.370135
    },
    {
        id: 8,
        name: "Budynek Parlamentu",
        address: "Dr.-Karl-Renner-Ring 3, 1017 Wien",
        latitude: 48.210033,
        longitude: 16.359951
    },
    {
        id: 9,
        name: "Schlosspark Schönbrunn",
        address: "Schönbrunner Schloßstraße 47, 1130 Wien",
        latitude: 48.184516,
        longitude: 16.312222
    },
    {
        id: 10,
        name: "Ratusz",
        address: "Rathausplatz, 1010 Wien",
        latitude: 48.210447,
        longitude: 16.357735
    },
    {
        id: 11,
        name: "Katedra św. Szczepana",
        address: "Stephansplatz 3, 1010 Wien",
        latitude: 48.208174,
        longitude: 16.373819
    },
    {
        id: 12,
        name: "Vienna Museum",
        address: "Karlsplatz 8, 1040 Wien",
        latitude: 48.199311,
        longitude: 16.370782
    },
    {
        id: 13,
        name: "Dworzec Autobusowy",
        address: "48°11'38\"N 16°24'33\"E",
        latitude: 48.194444, // 48°11'38"N converted to decimal
        longitude: 16.409167, // 16°24'33"E converted to decimal
        customColor: 'yellow'
    }
];