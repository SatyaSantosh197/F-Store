/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required: [username, email, password]
 *
 *     User:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user]
 *         isApproved:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required: [username, email, password]
 *
 *     FolderLogEntry:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         performedBy:
 *           type: string
 *         performedAt:
 *           type: string
 *           format: date-time
 *
 *     Folder:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         locked:
 *           type: boolean
 *         passwordHash:
 *           type: string
 *         visibility:
 *           type: string
 *           enum: [private, public]
 *         createdBy:
 *           type: string
 *         mods:
 *           type: array
 *           items:
 *             type: string
 *         files:
 *           type: array
 *           items:
 *             type: string
 *         parentFolder:
 *           type: string
 *         log:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FolderLogEntry'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required: [name, createdBy]
 *
 *     FileLogEntry:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *         performedBy:
 *           type: string
 *         performedAt:
 *           type: string
 *           format: date-time
 *
 *     File:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         actualFileName:
 *           type: string
 *         telegramFileId:
 *           type: string
 *         telegramMessageId:
 *           type: string
 *         folder:
 *           type: string
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         log:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileLogEntry'
 *       required: [name, actualFileName, telegramFileId, telegramMessageId, createdBy]
 */
