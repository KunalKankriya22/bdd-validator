<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile - PHP Okta Auth</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            padding-top: 60px;
        }
        .profile-card {
            margin-top: 2rem;
            padding: 2rem;
            background-color: #f8f9fa;
            border-radius: 0.3rem;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
        }
        .profile-info {
            margin-top: 1.5rem;
        }
        .profile-info dt {
            font-weight: bold;
        }
        .profile-info dd {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
        <div class="container">
            <a class="navbar-brand" href="/">PHP Okta Auth</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="/profile">Profile</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/logout">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <main class="container">
        <div class="profile-card">
            <h1 class="mb-4">Your Profile</h1>
            <p class="lead">Here's the information we have about you from Okta.</p>
            
            <div class="profile-info">
                <dl class="row">
                    <dt class="col-sm-3">Name</dt>
                    <dd class="col-sm-9"><?php echo htmlspecialchars($user['name'] ?? 'Not provided'); ?></dd>
                    
                    <dt class="col-sm-3">Email</dt>
                    <dd class="col-sm-9"><?php echo htmlspecialchars($user['email'] ?? 'Not provided'); ?></dd>
                    
                    <dt class="col-sm-3">Username</dt>
                    <dd class="col-sm-9"><?php echo htmlspecialchars($user['preferred_username'] ?? 'Not provided'); ?></dd>
                    
                    <dt class="col-sm-3">Locale</dt>
                    <dd class="col-sm-9"><?php echo htmlspecialchars($user['locale'] ?? 'Not provided'); ?></dd>
                    
                    <dt class="col-sm-3">Timezone</dt>
                    <dd class="col-sm-9"><?php echo htmlspecialchars($user['zoneinfo'] ?? 'Not provided'); ?></dd>
                    
                    <dt class="col-sm-3">Updated At</dt>
                    <dd class="col-sm-9"><?php echo isset($user['updated_at']) ? date('Y-m-d H:i:s', $user['updated_at']) : 'Not provided'; ?></dd>
                </dl>
            </div>
            
            <hr class="my-4">
            <a href="/" class="btn btn-primary">Back to Home</a>
            <a href="/logout" class="btn btn-outline-danger ms-2">Logout</a>
        </div>
    </main>

    <footer class="container text-center mt-5">
        <p>&copy; <?php echo date('Y'); ?> PHP Okta Auth</p>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
