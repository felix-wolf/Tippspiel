DROP VIEW IF EXISTS VIEW_Athletes;

CREATE VIEW VIEW_Athletes AS
    SELECT
        a.*,
        COALESCE(c.flag, '🏴‍☠️') AS flag
    FROM Athletes a
    LEFT JOIN Countries c ON a.country_code = c.code;

DROP VIEW IF EXISTS VIEW_Results;

CREATE VIEW VIEW_Results AS
    SELECT
        r.*,
        CASE
            WHEN va.id IS NOT NULL THEN COALESCE(va.flag, '🏴‍☠️') || '  ' || va.first_name || ' ' || va.last_name
            WHEN c.code IS NOT NULL THEN COALESCE(c.flag, '🏴‍☠️') || '  ' || c.name
            ELSE 'unknown'
        END AS object_name
    FROM Results r
    LEFT JOIN VIEW_Athletes va ON r.object_id = va.id
    LEFT JOIN Countries c ON r.object_id = c.code;

DROP VIEW IF EXISTS VIEW_Predictions;

CREATE VIEW VIEW_Predictions AS
    SELECT
        p.*,
        CASE
            WHEN va.id IS NOT NULL THEN COALESCE(va.flag, '🏴‍☠️') || '  ' || va.first_name || ' ' || va.last_name
            WHEN c.code IS NOT NULL THEN COALESCE(c.flag, '🏴‍☠️') || '  ' || c.name
            ELSE 'unknown'
        END AS object_name
    FROM Predictions p
    LEFT JOIN VIEW_Athletes va ON p.object_id = va.id
    LEFT JOIN Countries c ON p.object_id = c.code;
