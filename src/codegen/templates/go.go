package main

import (
/// if IS_POST ///
	"bytes"
/// endif ///
	"encoding/json"
	"fmt"
	"net/http"
)

type searchResponse struct {
	Entries []struct {
		ID string `json:"id"`
	} `json:"__RESULT_ARRAY_KEY__"`
}

func main() {
	url := "__REQUEST_URL__"
/// if IS_POST ///
	payload := __REQUEST_BODY__
	body, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
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
