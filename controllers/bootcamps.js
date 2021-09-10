const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const geocoder = require('../utils/geocode');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Get a single bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    // return bootcamp;
    // ? res.status(200).json({
    //     success: true,
    //     message: 'Fetch bootcamp data successfully',
    //     data: bootcamp,
    //   })
    // : res
    //     .status(404)
    //     .json({ success: false, message: 'Bootcamp not found!' });

    if (!bootcamp)
        return next(
            new ErrorResponse(
                `Bootcamp not found with id of ${req.params.id}`,
                404
            )
        );

    res.status(200).json({
        success: true,
        message: 'Fetch bootcamp data successfully',
        data: bootcamp,
    });
});

// @desc    Create new bootcamp
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // Add User to req.body
    req.body.user = req.user.id;

    // Check for published bootcamp
    const publishedBootcam = await Bootcamp.findOne({ user: req.user.id });

    // If the user is not an admin, they can only add one bootcamp
    if (publishedBootcam && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} has already published a bootcamp`,
                400
            )
        );
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        message: 'Bootcamp created successfully',
        data: bootcamp,
    });
});

// @desc    Update a single bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp)
        next(
            new ErrorResponse(
                `Bootcamp not found with id of ${req.params.id}`,
                404
            )
        );

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.params.id} is not authorized to update this bootcamp`,
                401
            )
        );
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: 'Bootcamp updated successfully',
        data: bootcamp,
    });
});

// @desc    Delete a single bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp)
        next(
            new ErrorResponse(
                `Bootcamp not found with id of ${req.params.id}`,
                404
            )
        );

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.params.id} is not authorized to delete this bootcamp`,
                401
            )
        );
    }

    bootcamp.remove();

    res.status(200).json({
        success: true,
        message: 'Bootcamp deleted successfully',
        // data: {},
    });
});

// @desc    Get bootcamp within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcodes/:distance
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi / 6,378km

    const radius = distance / 3963;

    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    res.status(200).json({
        success: true,
        data: bootcamps,
    });
});

// @desc    Upload photo for a single bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp)
        next(
            new ErrorResponse(
                `Bootcamp not found with id of ${req.params.id}`,
                404
            )
        );

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.params.id} is not authorized to delete this bootcamp`,
                401
            )
        );
    }

    if (!req.files) next(new ErrorResponse('Please upload a file', 400));

    const file = req.files.file;

    // Make sure the image is a photo

    if (!file.mimetype.startsWith('image'))
        next(new ErrorResponse('Please upload a valid image file', 400));

    // Check filesize
    const maxFileSize = process.env.MAX_FILE_UPLOAD;
    if (file.size > maxFileSize)
        next(
            new ErrorResponse(
                `Please upload an image less than ${maxFileSize}`,
                400
            )
        );

    // Create custom filename
    file.name = `photo_${bootcamp.id}${path.parse(file.name).ext}`;

    // Another way to get the file extension
    /**
     * const fileName = file.name.split('.');
     * const fileExt = '.' + String(fileName[fileName.length - 1]);
     */

    // Upload file
    const fileUploadPath = process.env.FILE_UPLOAD_PATH;
    file.mv(`${fileUploadPath}/${file.name}`, async (err) => {
        if (err) {
            console.error(err);
            return next(
                new ErrorResponse(`Problem with file upload ${err}`, 500)
            );
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, {
            photo: file.name,
        });

        res.status(200).json({
            success: true,
            message: 'Photo added successfully',
            data: file.name,
        });
    });
});
