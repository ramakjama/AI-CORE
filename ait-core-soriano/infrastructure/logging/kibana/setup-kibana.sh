#!/bin/bash

##############################################################################
# Kibana Setup Script
# Configura index patterns, dashboards y alertas
##############################################################################

set -e

KIBANA_URL="http://localhost:5601"

echo "========================================="
echo "🔧 Setting up Kibana"
echo "========================================="
echo ""

# Wait for Kibana to be ready
echo "⏳ Waiting for Kibana to be ready..."
for i in {1..30}; do
    if curl -s "$KIBANA_URL/api/status" > /dev/null 2>&1; then
        echo "✅ Kibana is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Kibana is not responding"
        exit 1
    fi
    sleep 2
done
echo ""

# Create index patterns
echo "📋 Creating index patterns..."

# Index pattern for ait-core
curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ait-ait-core" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "ait-ait-core-*",
      "timeFieldName": "timestamp"
    }
  }' 2>/dev/null || echo "ℹ️  ait-core pattern already exists"

# Index pattern for ain-tech-web
curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ait-ain-tech-web" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "ait-ain-tech-web-*",
      "timeFieldName": "timestamp"
    }
  }' 2>/dev/null || echo "ℹ️  ain-tech-web pattern already exists"

# Index pattern for soriano-ecliente
curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ait-soriano-ecliente" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "ait-soriano-ecliente-*",
      "timeFieldName": "timestamp"
    }
  }' 2>/dev/null || echo "ℹ️  soriano-ecliente pattern already exists"

# Index pattern for ait-engines
curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ait-ait-engines" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "ait-ait-engines-*",
      "timeFieldName": "timestamp"
    }
  }' 2>/dev/null || echo "ℹ️  ait-engines pattern already exists"

# Index pattern for all (wildcard)
curl -X POST "$KIBANA_URL/api/saved_objects/index-pattern/ait-all" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{
    "attributes": {
      "title": "ait-*",
      "timeFieldName": "timestamp"
    }
  }' 2>/dev/null || echo "ℹ️  ait-all pattern already exists"

echo "✅ Index patterns created"
echo ""

# Set default index pattern
echo "🎯 Setting default index pattern..."
curl -X POST "$KIBANA_URL/api/kibana/settings/defaultIndex" \
  -H 'kbn-xsrf: true' \
  -H 'Content-Type: application/json' \
  -d '{"value":"ait-all"}' 2>/dev/null || echo "ℹ️  Default pattern already set"

echo "✅ Default index pattern set"
echo ""

echo "========================================="
echo "✅ Kibana setup complete!"
echo "========================================="
echo ""
echo "Index patterns created:"
echo "  - ait-ait-core-*"
echo "  - ait-ain-tech-web-*"
echo "  - ait-soriano-ecliente-*"
echo "  - ait-ait-engines-*"
echo "  - ait-* (default)"
echo ""
echo "Next steps:"
echo "1. Open Kibana: $KIBANA_URL"
echo "2. Go to Analytics > Discover"
echo "3. Select an index pattern"
echo "4. Start exploring your logs!"
echo ""
echo "Import dashboards:"
echo "  - Go to Management > Stack Management > Saved Objects"
echo "  - Click 'Import' and select kibana/dashboards/*.ndjson"
echo "========================================="
