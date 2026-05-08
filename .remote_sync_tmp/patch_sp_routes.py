"""Patch serviceProviderPortalRoutes.js to add shelf and action endpoints"""

filepath = '/home/cw/a/community-backend/backend/src/routes/serviceProviderPortalRoutes.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'shelfService' in content:
    print('Already patched, skipping')
else:
    # Insert new routes before module.exports
    new_routes = """router.post('/services/:id/shelf', auth, ctrl.shelfService);
router.post('/orders/:id/action', auth, ctrl.orderAction);
"""
    content = content.replace('module.exports = router;', new_routes + '\nmodule.exports = router;')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('OK: patched', filepath)
