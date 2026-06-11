package graphql

import "github.com/graphql-go/graphql"

// All object types are resolved with graphql-go's default field resolver, which
// matches GraphQL field names case-insensitively against the Go struct fields
// (and json tags) of the value returned by each top-level resolver. The string
// fields below (outcome, mode) therefore serialize to their lowercase values
// (e.g. "blocked"), keeping the contract identical to the old REST JSON.

var callLogType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CallLog",
	Fields: graphql.Fields{
		"id":           &graphql.Field{Type: graphql.NewNonNull(graphql.ID)},
		"callerNumber": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"spamScore":    &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
		"outcome":      &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"mode":         &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"carrierType":  &graphql.Field{Type: graphql.String},
		"carrierName":  &graphql.Field{Type: graphql.String},
		"isVoip":       &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		"isSpoofed":    &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		"createdAt":    &graphql.Field{Type: graphql.NewNonNull(graphql.DateTime)},
	},
})

var callLogPageType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CallLogPage",
	Fields: graphql.Fields{
		"data":  &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(callLogType)))},
		"total": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
	},
})

var dailyStatType = graphql.NewObject(graphql.ObjectConfig{
	Name: "DailyStat",
	Fields: graphql.Fields{
		"date":    &graphql.Field{Type: graphql.NewNonNull(graphql.DateTime)},
		"total":   &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"blocked": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
	},
})

var statsType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CallStats",
	Fields: graphql.Fields{
		"total":       &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"blocked":     &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"today":       &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"blockedRate": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"dailyStats":  &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(dailyStatType)))},
	},
})

var carrierReportType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CarrierReport",
	Fields: graphql.Fields{
		"carrier":     &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"abuseEmail":  &graphql.Field{Type: graphql.String},
		"abuseUrl":    &graphql.Field{Type: graphql.String},
		"numberCount": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"numbers":     &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(graphql.String)))},
		"unmatched":   &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
	},
})

var userType = graphql.NewObject(graphql.ObjectConfig{
	Name: "User",
	Fields: graphql.Fields{
		"id":        &graphql.Field{Type: graphql.NewNonNull(graphql.ID)},
		"email":     &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"createdAt": &graphql.Field{Type: graphql.NewNonNull(graphql.DateTime)},
	},
})

var authTokenType = graphql.NewObject(graphql.ObjectConfig{
	Name: "AuthToken",
	Fields: graphql.Fields{
		"token": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
	},
})

var sendReportResultType = graphql.NewObject(graphql.ObjectConfig{
	Name: "SendReportResult",
	Fields: graphql.Fields{
		"sent": &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
	},
})

var carrierInfoType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CarrierInfo",
	Fields: graphql.Fields{
		"isVoip":         &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		"isNonFixedVoip": &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		"isSpoofed":      &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
		"carrierType":    &graphql.Field{Type: graphql.String},
		"carrierName":    &graphql.Field{Type: graphql.String},
	},
})

var checkResultType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CheckResult",
	Fields: graphql.Fields{
		"outcome":        &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"score":          &graphql.Field{Type: graphql.NewNonNull(graphql.Float)},
		"reasons":        &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(graphql.String)))},
		"carrier":        &graphql.Field{Type: graphql.NewNonNull(carrierInfoType)},
		"communityFlags": &graphql.Field{Type: graphql.NewNonNull(graphql.Int)},
		"twiml":          &graphql.Field{Type: graphql.String},
	},
})
