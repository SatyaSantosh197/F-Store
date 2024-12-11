/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin management endpoints
 *   - name: User
 *     description: User signup and login
 *   - name: Folder
 *     description: Folder management endpoints
 *   - name: File
 *     description: File management endpoints
 */

/**
 * @swagger
 * /api/admins/signup:
 *   post:
 *     summary: Admin signup
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Admin created successfully
 *       "400":
 *         description: Invalid details or admin already exists
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/admins/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Admin login successful
 *       "401":
 *         description: Invalid credentials
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/admins/approve-user:
 *   post:
 *     summary: Approve a user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       "200":
 *         description: User approved successfully
 *       "404":
 *         description: User not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/admins/getPendingUsers:
 *   get:
 *     summary: Get all pending users
 *     tags: [Admin]
 *     responses:
 *       "200":
 *         description: List of pending users
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: User signup
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "201":
 *         description: User registered, awaiting admin approval
 *       "400":
 *         description: Invalid details or user already exists
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Login successful
 *       "401":
 *         description: Invalid credentials
 *       "403":
 *         description: User not approved by admin
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/create:
 *   post:
 *     summary: Create a new folder
 *     tags: [Folder]
 *     parameters:
 *       - in: header
 *         name: parent-folder-id
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of the parent folder if the folder is being created inside another folder.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the folder
 *               locked:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the folder is locked
 *               password:
 *                 type: string
 *                 description: Password for locking the folder (required if locked is true)
 *               visibility:
 *                 type: string
 *                 enum: [private, public]
 *                 default: public
 *                 description: Visibility of the folder
 *     responses:
 *       "201":
 *         description: Folder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Folder created successfully
 *                 folder:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     locked:
 *                       type: boolean
 *                     visibility:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     parentFolder:
 *                       type: string
 *       "400":
 *         description: Password is required when locking a folder
 *       "404":
 *         description: Parent folder not found
 *       "403":
 *         description: Unauthorized to create folder in parent folder
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/rename/{folderId}:
 *   post:
 *     summary: Rename a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Folder renamed successfully
 *       "404":
 *         description: Folder not found
 *       "403":
 *         description: Unauthorized to rename folder
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/delete/{folderId}:
 *   post:
 *     summary: Delete a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Folder deleted successfully
 *       "400":
 *         description: Cannot delete folder with subfolders or files
 *       "404":
 *         description: Folder not found
 *       "403":
 *         description: Unauthorized to delete folder
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/lock/{folderId}:
 *   post:
 *     summary: Lock a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Folder locked successfully
 *       "400":
 *         description: Folder already locked or password missing
 *       "403":
 *         description: Unauthorized to lock folder
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/unlock/{folderId}:
 *   post:
 *     summary: Unlock a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Folder unlocked successfully
 *       "400":
 *         description: Folder not locked
 *       "401":
 *         description: Incorrect password
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/open/{folderId}:
 *   post:
 *     summary: Open a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Folder opened successfully
 *       "401":
 *         description: Folder is locked
 *       "403":
 *         description: Unauthorized to open private folder
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/toggle-visibility/{folderId}:
 *   post:
 *     summary: Toggle folder visibility (public/private)
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Folder visibility toggled
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/addMod/{folderId}:
 *   post:
 *     summary: Add a mod to a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               newModUserId:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Mod added successfully
 *       "400":
 *         description: User already a mod
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/search:
 *   get:
 *     summary: Search files and folders
 *     tags: [Folder]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: "Search query for names"
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [public, private]
 *         description: "Filter by visibility"
 *     responses:
 *       "200":
 *         description: Search results returned
 *       "400":
 *         description: Query parameter missing
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/folders/contents/{folderId}:
 *   get:
 *     summary: List files and subfolders in a folder
 *     tags: [Folder]
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Contents retrieved successfully
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to be uploaded
 *               name:
 *                 type: string
 *                 description: Name of the file
 *               folderId:
 *                 type: string
 *                 description: ID of the folder to upload the file into (optional)
 *     responses:
 *       "201":
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: File uploaded successfully
 *                 file:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     folder:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       "400":
 *         description: No file provided or validation error
 *       "404":
 *         description: Folder not found
 *       "500":
 *         description: Internal Server Error
 */


/**
 * @swagger
 * /api/files/download/{fileId}:
 *   get:
 *     summary: Download a file
 *     tags: [File]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: File downloaded
 *       "404":
 *         description: File not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/files/rename/{fileId}:
 *   post:
 *     summary: Rename a file
 *     tags: [File]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       "200":
 *         description: File renamed
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: File or folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/files/delete/{fileId}:
 *   delete:
 *     summary: Delete a file
 *     tags: [File]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: File deleted
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: File or folder not found
 *       "500":
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/files/move/{fileId}:
 *   post:
 *     summary: Move a file to another folder
 *     tags: [File]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               newFolderId:
 *                 type: string
 *     responses:
 *       "200":
 *         description: File moved successfully
 *       "403":
 *         description: Unauthorized
 *       "404":
 *         description: File or folder not found
 *       "500":
 *         description: Internal Server Error
 */

