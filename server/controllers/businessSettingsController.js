import BusinessSettings from "../models/businessSettingsModel.js";
import HandleError from "../utils/handleError.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import mongoose from "mongoose";

// Default settings fallback
const DEFAULT_SETTINGS = {
  phone: "9840604668",
  whatsapp: "9840604668", 
  email: "mail@megahimalaya.com",
  address: {
    street: "Mahendra Pool",
    city: "Pokhara", 
    postalCode: "33700",
    country: "Nepal"
  },
  openingHours: {
    weekdays: "Sun–Fri: 10:00 AM – 6:00 PM",
    saturday: "Closed"
  },
  companyName: "Mega Himalaya",
  tagline: "Optical House",
  description: "Pokhara's premier destination for international eyewear, watches and fragrances founded by Mr. Suraj Singh in 2001.",
  socialMedia: {
    facebook: "",
    instagram: "", 
    tiktok: ""
  }
};

// Get business settings (public route for footer)
// GET /api/v1/business-settings
export const getBusinessSettings = handleAsyncError(async (req, res) => {
  try {
    let settings = await BusinessSettings.findOne().select('-lastUpdatedBy -createdAt -updatedAt');

    // If no settings exist, return defaults without creating DB record
    if (!settings) {
      return res.status(200).json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Database error in getBusinessSettings:', error);
    // Return defaults if database error
    res.status(200).json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
});

// Update business settings (admin only)
// PUT /api/v1/admin/business-settings
export const updateBusinessSettings = handleAsyncError(async (req, res, next) => {
  const {
    phone,
    whatsapp,
    email,
    address,
    openingHours,
    companyName,
    tagline,
    description,
    socialMedia,
  } = req.body;

  try {
    let settings = await BusinessSettings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new BusinessSettings({
        phone: phone || DEFAULT_SETTINGS.phone,
        whatsapp: whatsapp || DEFAULT_SETTINGS.whatsapp,
        email: email || DEFAULT_SETTINGS.email,
        address: address || DEFAULT_SETTINGS.address,
        openingHours: openingHours || DEFAULT_SETTINGS.openingHours,
        companyName: companyName || DEFAULT_SETTINGS.companyName,
        tagline: tagline || DEFAULT_SETTINGS.tagline, 
        description: description || DEFAULT_SETTINGS.description,
        socialMedia: socialMedia || DEFAULT_SETTINGS.socialMedia,
        lastUpdatedBy: req.user._id,
      });
    } else {
      // Update existing settings
      if (phone !== undefined) settings.phone = phone;
      if (whatsapp !== undefined) settings.whatsapp = whatsapp;
      if (email !== undefined) settings.email = email;
      if (address !== undefined) settings.address = { ...settings.address, ...address };
      if (openingHours !== undefined) settings.openingHours = { ...settings.openingHours, ...openingHours };
      if (companyName !== undefined) settings.companyName = companyName;
      if (tagline !== undefined) settings.tagline = tagline;
      if (description !== undefined) settings.description = description;
      if (socialMedia !== undefined) settings.socialMedia = { ...settings.socialMedia, ...socialMedia };
      
      settings.lastUpdatedBy = req.user._id;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Business settings updated successfully",
      settings: {
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        openingHours: settings.openingHours,
        companyName: settings.companyName,
        tagline: settings.tagline,
        description: settings.description,
        socialMedia: settings.socialMedia,
      },
    });
  } catch (error) {
    console.error('Error updating business settings:', error);
    return next(new HandleError("Failed to update business settings", 500));
  }
});