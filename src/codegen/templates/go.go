package main

import (
	"encoding/json"
	"fmt"
	"net/http"
/// if IS_POST ///
	"strings"
/// endif ///
)

type searchResponse struct {
	Entries []struct {
		ID string `json:"id"`
	} `json:"__RESULT_ARRAY_KEY__"`
}

func main() {
	url := "__REQUEST_URL__"
/// if IS_POST ///
	body := `__REQUEST_BODY__`
	resp, err := http.Post(url, "application/json", strings.NewReader(body))
/// else ///
	resp, err := http.Get(url)
/// endif ///
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	var result searchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		panic(err)
	}

	for _, entry := range result.Entries {
		fmt.Println(entry.ID)
	}
}
