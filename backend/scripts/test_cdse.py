import urllib.request
import urllib.parse
import json

def test_cdse_search():
    print("[*] Testing live Copernicus CDSE REST/OData API query for Tamil Nadu...")
    base_url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    filter_expr = "Collection/Name eq 'SENTINEL-1' and contains(Name,'SLC') and OData.CSC.Intersects(area=geography'SRID=4326;POLYGON((76.3 11.1, 77.2 11.1, 77.2 11.7, 76.3 11.7, 76.3 11.1))')"
    params = {
        "$filter": filter_expr,
        "$top": 5,
        "$orderby": "ContentDate/Start desc"
    }
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    
    req = urllib.request.Request(url, headers={"User-Agent": "ZoneGuard-AI/2.4"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
            products = data.get("value", [])
            print(f"[OK] Live query succeeded! Found {len(products)} real Sentinel-1 SLC scenes over Tamil Nadu:")
            for p in products:
                print(f"  • Scene: {p.get('Name')}")
                print(f"    Date: {p.get('ContentDate', {}).get('Start')}, Size: {round((p.get('ContentLength', 0) / (1024**3)), 2)} GB")
            return products
    except Exception as e:
        print(f"[!] Query failed: {str(e)}")
        return []

if __name__ == "__main__":
    test_cdse_search()
