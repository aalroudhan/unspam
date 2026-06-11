package graphql

import (
	"github.com/aalroudhan/unspam/internal/auth"
	"github.com/aalroudhan/unspam/internal/reports"
	"github.com/aalroudhan/unspam/internal/repository"
	"github.com/aalroudhan/unspam/internal/webhook"
	"github.com/graphql-go/graphql"
)

// Resolver holds the services and repositories the GraphQL schema resolves
// against. It is the GraphQL equivalent of the old REST handlers — the
// underlying services and repositories are reused unchanged.
type Resolver struct {
	calls   *repository.CallsRepository
	flags   *repository.CommunityFlagsRepository
	auth    *auth.Service
	reports *reports.Service
	webhook *webhook.Service
}

// NewSchema wires every query and mutation against the given dependencies.
func NewSchema(
	calls *repository.CallsRepository,
	flags *repository.CommunityFlagsRepository,
	authSvc *auth.Service,
	reportsSvc *reports.Service,
	webhookSvc *webhook.Service,
) (graphql.Schema, error) {
	r := &Resolver{
		calls:   calls,
		flags:   flags,
		auth:    authSvc,
		reports: reportsSvc,
		webhook: webhookSvc,
	}

	query := graphql.NewObject(graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"callStats": &graphql.Field{
				Type:        graphql.NewNonNull(statsType),
				Description: "Aggregated stats and 7-day daily trend",
				Resolve:     r.callStats,
			},
			"callLog": &graphql.Field{
				Type:        graphql.NewNonNull(callLogPageType),
				Description: "Paginated call log",
				Args: graphql.FieldConfigArgument{
					"page":    &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 1},
					"limit":   &graphql.ArgumentConfig{Type: graphql.Int, DefaultValue: 20},
					"outcome": &graphql.ArgumentConfig{Type: graphql.String},
				},
				Resolve: r.callLog,
			},
			"reports": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.NewList(graphql.NewNonNull(carrierReportType))),
				Description: "Generate carrier complaint reports from intercepted call log",
				Resolve:     r.reportsList,
			},
			"me": &graphql.Field{
				Type:        userType,
				Description: "Current authenticated user",
				Resolve:     r.me,
			},
		},
	})

	mutation := graphql.NewObject(graphql.ObjectConfig{
		Name: "Mutation",
		Fields: graphql.Fields{
			"register": &graphql.Field{
				Type: graphql.NewNonNull(authTokenType),
				Args: graphql.FieldConfigArgument{
					"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: r.register,
			},
			"login": &graphql.Field{
				Type: graphql.NewNonNull(authTokenType),
				Args: graphql.FieldConfigArgument{
					"email":    &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: r.login,
			},
			"flagNumber": &graphql.Field{
				Type:        graphql.NewNonNull(graphql.Boolean),
				Description: "Community-flag a number as spam (requires auth)",
				Args: graphql.FieldConfigArgument{
					"number": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: r.flagNumber,
			},
			"sendReport": &graphql.Field{
				Type:        graphql.NewNonNull(sendReportResultType),
				Description: "Send complaint email to a carrier abuse desk (requires auth)",
				Args: graphql.FieldConfigArgument{
					"carrier":  &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
					"testMode": &graphql.ArgumentConfig{Type: graphql.Boolean, DefaultValue: false},
				},
				Resolve: r.sendReport,
			},
			"checkNumber": &graphql.Field{
				Type:        graphql.NewNonNull(checkResultType),
				Description: "Score and decide on an incoming number",
				Args: graphql.FieldConfigArgument{
					"callerNumber": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
				},
				Resolve: r.checkNumber,
			},
		},
	})

	return graphql.NewSchema(graphql.SchemaConfig{Query: query, Mutation: mutation})
}

// ── Query resolvers ─────────────────────────────────────────────────────────

func (r *Resolver) callStats(p graphql.ResolveParams) (interface{}, error) {
	return r.calls.GetStats()
}

func (r *Resolver) callLog(p graphql.ResolveParams) (interface{}, error) {
	page, _ := p.Args["page"].(int)
	limit, _ := p.Args["limit"].(int)
	outcome, _ := p.Args["outcome"].(string)

	data, total, err := r.calls.FindPaginated(page, limit, outcome)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"data": data, "total": total}, nil
}

func (r *Resolver) reportsList(p graphql.ResolveParams) (interface{}, error) {
	reps, err := r.reports.GenerateReports()
	if err != nil {
		return nil, err
	}
	out := make([]map[string]interface{}, len(reps))
	for i, rep := range reps {
		var email, url interface{}
		if rep.AbuseEmail != nil {
			email = *rep.AbuseEmail
		}
		if rep.AbuseURL != nil {
			url = *rep.AbuseURL
		}
		out[i] = map[string]interface{}{
			"carrier":     rep.Carrier,
			"abuseEmail":  email,
			"abuseUrl":    url,
			"numberCount": rep.NumberCount,
			"numbers":     rep.Numbers,
			"unmatched":   rep.Unmatched,
		}
	}
	return out, nil
}

func (r *Resolver) me(p graphql.ResolveParams) (interface{}, error) {
	userID, ok := userIDFromContext(p.Context)
	if !ok {
		return nil, ErrUnauthenticated
	}
	return r.auth.ValidateByID(userID)
}

// ── Mutation resolvers ──────────────────────────────────────────────────────

func (r *Resolver) register(p graphql.ResolveParams) (interface{}, error) {
	email := p.Args["email"].(string)
	password := p.Args["password"].(string)
	token, err := r.auth.Register(email, password)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"token": token}, nil
}

func (r *Resolver) login(p graphql.ResolveParams) (interface{}, error) {
	email := p.Args["email"].(string)
	password := p.Args["password"].(string)
	token, err := r.auth.Login(email, password)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"token": token}, nil
}

func (r *Resolver) flagNumber(p graphql.ResolveParams) (interface{}, error) {
	if _, ok := userIDFromContext(p.Context); !ok {
		return nil, ErrUnauthenticated
	}
	if err := r.flags.Increment(p.Args["number"].(string)); err != nil {
		return nil, err
	}
	return true, nil
}

func (r *Resolver) sendReport(p graphql.ResolveParams) (interface{}, error) {
	if _, ok := userIDFromContext(p.Context); !ok {
		return nil, ErrUnauthenticated
	}
	carrier := p.Args["carrier"].(string)
	testMode, _ := p.Args["testMode"].(bool)
	if err := r.reports.SendReport(carrier, testMode); err != nil {
		return nil, err
	}
	return map[string]interface{}{"sent": true}, nil
}

func (r *Resolver) checkNumber(p graphql.ResolveParams) (interface{}, error) {
	return r.webhook.HandleIncomingCall(p.Args["callerNumber"].(string))
}
