

router.get('/statsp', async (req, res) => {
    try {
        const [activeResult, inactiveResult, totalResult] = await Promise.all([
            query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'active'`),
            query(`SELECT COUNT(*) FROM partenariat WHERE statut = 'inactive'`),
            query(`SELECT COUNT(*) FROM partenariat`)
        ]);

        const active = parseInt(activeResult.rows[0].count);
        const inactive = parseInt(inactiveResult.rows[0].count);
        const total = parseInt(totalResult.rows[0].count);

        res.json({
            success: true,
            data: {
                active,
                inactive,
                total,
                activePercentage: Math.round((active / total) * 100) || 0,
                inactivePercentage: Math.round((inactive / total) * 100) || 0
            }
        });
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: err.message 
        });
    }
});
