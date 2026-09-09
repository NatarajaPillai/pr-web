import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { INITIAL_PARCELS } from "./src/data/mockParcels";
import { LandParcel, EnquiryRequest } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // In-memory data store seeded with INITIAL_PARCELS
  let parcels: LandParcel[] = [...INITIAL_PARCELS];
  const enquiries: EnquiryRequest[] = [
    {
      id: "enq-1",
      parcelId: "parcel-mumbai-bkc-01",
      parcelUlpin: "27MH8899001122",
      unitId: "u-12-1",
      unitNumber: "Suite 1201",
      name: "Rajeshwar Singhania",
      email: "rajeshwar@singhaniahomes.in",
      phone: "+91 98201 45890",
      message: "Requesting site inspection and technical due diligence report for Suite 1201.",
      date: "2025-02-14",
    },
  ];

  // API: Get all parcels with optional filtering
  app.get("/api/parcels", (req, res) => {
    try {
      const { search, state, classification, status, minPrice, maxPrice } = req.query;
      let filtered = [...parcels];

      if (search && typeof search === "string") {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            p.ulpin.toLowerCase().includes(q) ||
            p.surveyNumber.toLowerCase().includes(q) ||
            p.talukVillage.toLowerCase().includes(q) ||
            p.district.toLowerCase().includes(q) ||
            p.state.toLowerCase().includes(q) ||
            (p.building && p.building.name.toLowerCase().includes(q))
        );
      }

      if (state && typeof state === "string" && state !== "all") {
        filtered = filtered.filter((p) => p.state.toLowerCase() === state.toLowerCase());
      }

      if (classification && typeof classification === "string" && classification !== "all") {
        filtered = filtered.filter((p) => p.classification === classification);
      }

      if (status && typeof status === "string" && status !== "all") {
        filtered = filtered.filter((p) => p.status === status);
      }

      if (minPrice && !isNaN(Number(minPrice))) {
        filtered = filtered.filter((p) => p.marketValuationCr >= Number(minPrice));
      }

      if (maxPrice && !isNaN(Number(maxPrice))) {
        filtered = filtered.filter((p) => p.marketValuationCr <= Number(maxPrice));
      }

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch parcels", details: err.message });
    }
  });

  // API: Parcel stats
  app.get("/api/stats", (req, res) => {
    const totalParcels = parcels.length;
    const verifiedParcels = parcels.filter((p) => p.status === "verified").length;
    const totalAcreage = parcels.reduce((acc, p) => acc + p.areaAcres, 0);
    const totalValuation = parcels.reduce((acc, p) => acc + p.marketValuationCr, 0);
    let totalUnits = 0;
    let availableUnits = 0;
    let bookedUnits = 0;
    let soldUnits = 0;

    parcels.forEach((p) => {
      p.building?.floors.forEach((f) => {
        f.units.forEach((u) => {
          totalUnits++;
          if (u.status === "available") availableUnits++;
          else if (u.status === "booked") bookedUnits++;
          else if (u.status === "sold") soldUnits++;
        });
      });
    });

    res.json({
      totalParcels,
      verifiedParcels,
      totalAcreage: Math.round(totalAcreage * 100) / 100,
      totalValuationCr: Math.round(totalValuation),
      totalUnits,
      availableUnits,
      bookedUnits,
      soldUnits,
    });
  });

  // API: Lookup parcel by ULPIN or survey
  app.get("/api/parcels/lookup/:ulpin", (req, res) => {
    const query = req.params.ulpin.toUpperCase().trim();
    const parcel = parcels.find(
      (p) =>
        p.ulpin.toUpperCase() === query ||
        p.id.toLowerCase() === query.toLowerCase() ||
        p.surveyNumber.toUpperCase().includes(query)
    );

    if (!parcel) {
      return res.status(404).json({
        error: `Land parcel with ULPIN "${query}" was not found in the cadastral registry.`,
      });
    }

    res.json(parcel);
  });

  // API: Get parcel by ID
  app.get("/api/parcels/:id", (req, res) => {
    const parcel = parcels.find((p) => p.id === req.params.id);
    if (!parcel) {
      return res.status(404).json({ error: "Parcel not found" });
    }
    res.json(parcel);
  });

  // API: Create new parcel
  app.post("/api/parcels", (req, res) => {
    try {
      const data = req.body as Partial<LandParcel>;

      if (!data.ulpin) {
        return res.status(400).json({ error: "ULPIN number is mandatory." });
      }

      const cleanUlpin = data.ulpin.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (cleanUlpin.length !== 14) {
        return res.status(400).json({
          error: `ULPIN must be exactly 14 alphanumeric characters. Received ${cleanUlpin.length}.`,
        });
      }

      // Check for duplicate ULPIN
      if (parcels.some((p) => p.ulpin.toUpperCase() === cleanUlpin)) {
        return res.status(409).json({
          error: `Parcel with ULPIN "${cleanUlpin}" is already registered in the system.`,
        });
      }

      const newId = `parcel-${Date.now()}`;
      const centerCoord = data.centerCoordinate || {
        lat: data.boundaries && data.boundaries.length ? data.boundaries[0].lat : 19.076,
        lng: data.boundaries && data.boundaries.length ? data.boundaries[0].lng : 72.8777,
      };

      const newParcel: LandParcel = {
        id: newId,
        ulpin: cleanUlpin,
        surveyNumber: data.surveyNumber || `Survey ${Math.floor(100 + Math.random() * 900)}`,
        subDivision: data.subDivision || "Revenue Sector A",
        state: data.state || "Maharashtra",
        district: data.district || "Mumbai",
        talukVillage: data.talukVillage || "Central Cadastre",
        pincode: data.pincode || "400001",
        areaSqMeters: data.areaSqMeters || 3500,
        areaAcres: data.areaAcres || Math.round((Number(data.areaSqMeters || 3500) / 4046.86) * 1000) / 1000,
        classification: data.classification || "commercial",
        status: data.status || "verified",
        ownerOfRecord: data.ownerOfRecord || "Registered Land Holder",
        registryDate: data.registryDate || new Date().toISOString().split("T")[0],
        mutationNumber: data.mutationNumber || `MUT-${Date.now().toString().slice(-6)}`,
        centerCoordinate: centerCoord,
        boundaries:
          data.boundaries && data.boundaries.length >= 3
            ? data.boundaries
            : [
                { lat: centerCoord.lat + 0.0006, lng: centerCoord.lng - 0.0006 },
                { lat: centerCoord.lat + 0.0007, lng: centerCoord.lng + 0.0008 },
                { lat: centerCoord.lat - 0.0005, lng: centerCoord.lng + 0.0007 },
                { lat: centerCoord.lat - 0.0006, lng: centerCoord.lng - 0.0007 },
              ],
        marketValuationCr: data.marketValuationCr || 85.0,
        zoningCode: data.zoningCode || "Mixed Use Commercial",
        floorSpaceIndexAllowed: data.floorSpaceIndexAllowed || 3.5,
        fsiConsumed: data.fsiConsumed || 2.8,
        images:
          data.images && data.images.length
            ? data.images
            : ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"],
        description: data.description || "Newly surveyed land parcel with mapped vertical spatial rights.",
        building: data.building,
      };

      parcels.unshift(newParcel);
      res.status(201).json(newParcel);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to create parcel", details: err.message });
    }
  });

  // API: Update parcel
  app.put("/api/parcels/:id", (req, res) => {
    const idx = parcels.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Parcel not found" });
    }

    parcels[idx] = {
      ...parcels[idx],
      ...req.body,
      id: req.params.id, // preserve ID
    };

    res.json(parcels[idx]);
  });

  // API: Delete parcel
  app.delete("/api/parcels/:id", (req, res) => {
    const idx = parcels.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Parcel not found" });
    }
    const removed = parcels.splice(idx, 1)[0];
    res.json({ message: "Parcel removed successfully", id: removed.id });
  });

  // API: Update specific unit status
  app.post("/api/parcels/:id/units/:unitId/status", (req, res) => {
    const { id, unitId } = req.params;
    const { status } = req.body;

    if (!["available", "booked", "sold"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const parcel = parcels.find((p) => p.id === id);
    if (!parcel || !parcel.building) {
      return res.status(404).json({ error: "Parcel or building not found" });
    }

    let foundUnit = null;
    for (const floor of parcel.building.floors) {
      for (const unit of floor.units) {
        if (unit.id === unitId) {
          unit.status = status;
          foundUnit = unit;
          break;
        }
      }
      if (foundUnit) break;
    }

    if (!foundUnit) {
      return res.status(404).json({ error: "Unit not found in building" });
    }

    res.json({ message: "Unit status updated", unit: foundUnit });
  });

  // API: Enquiries
  app.get("/api/enquiries", (req, res) => {
    res.json(enquiries);
  });

  app.post("/api/enquiries", (req, res) => {
    const { parcelId, parcelUlpin, unitId, unitNumber, name, email, phone, message } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone number are required" });
    }

    const newEnquiry: EnquiryRequest = {
      id: `enq-${Date.now()}`,
      parcelId,
      parcelUlpin,
      unitId,
      unitNumber,
      name,
      email,
      phone,
      message: message || "Interested in this property unit and cadastral record verification.",
      date: new Date().toISOString().split("T")[0],
    };

    enquiries.unshift(newEnquiry);
    res.status(201).json({ message: "Enquiry submitted successfully", enquiry: newEnquiry });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
